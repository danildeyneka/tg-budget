import { randomBytes } from 'node:crypto'
import { Composer, InlineKeyboard } from 'grammy'
import { ObjectId } from 'mongodb'
import type { MyContext } from '../../../types/context.ts'
import { COMMANDS } from '../../../constants/commands.ts'
import { loadCallbacks } from '../../callbacks/index.ts'
import { reminderCallbacks, chooseTerm } from './reminders.router.ts'
import { reminderExpenseCallbacks, startReminderExpense } from './reminder-expense.router.ts'
import { nextDate } from '../../../services/reminders/schedule.ts'
import { REMINDER_STEPS, REPEATS } from './constants.ts'

export const remindersComposer = new Composer<MyContext>()
loadCallbacks(reminderCallbacks)
loadCallbacks(reminderExpenseCallbacks)

remindersComposer.command(COMMANDS.REMINDERS, async (ctx) => {
  ctx.session.nextStep = ''
  delete ctx.session.reminderDraft
  delete ctx.session.reminderExpense
  await showList(ctx)
})

async function showList(ctx: MyContext, after?: string) {
  const records = await ctx.db.reminders.find({ from: ctx.from!.id, ...(after ? { _id: { $lt: new ObjectId(after) } } : {}) })
    .sort({ _id: -1 }).limit(11).toArray()
  const keyboard = new InlineKeyboard().text('Создать', 'rm:new').row()
  for (const record of records.slice(0, 10)) {
    const active = record.nextAt !== null || record.snoozeAt !== null
    keyboard.text(`${record.completedAt ? 'Завершено' : active ? record.date : 'Ожидает решения'}: ${record.text.slice(0, 35)}`, `rm:v:${record._id}`).row()
  }
  if (records.length > 10) keyboard.text('Далее', `rm:list:${records[9]!._id}`)
  await ctx.reply(records.length ? 'Ваши напоминания' : 'Напоминаний пока нет', { reply_markup: keyboard })
}

remindersComposer.callbackQuery(/^rm:/, async (ctx) => {
  const [, action, id, token] = ctx.callbackQuery.data.split(':')
  if (action === 'new') {
    ctx.session.reminderDraft = {}
    ctx.session.nextStep = REMINDER_STEPS.TEXT
    await ctx.answerCallbackQuery()
    await ctx.reply('Введите текст напоминания', { reply_markup: { remove_keyboard: true } })
    return
  }
  if (!id || !/^[a-f\d]{24}$/.test(id)) {
    await ctx.answerCallbackQuery('Некорректная кнопка')
    return
  }
  if (action === 'list') {
    await ctx.answerCallbackQuery()
    await showList(ctx, id)
    return
  }
  const filter = { _id: new ObjectId(id), from: ctx.from.id }
  const record = await ctx.db.reminders.findOne(filter)
  if (!record) {
    await ctx.answerCallbackQuery('Напоминание недоступно')
    return
  }
  if (action === 'v') {
    const dates = [record.snoozeAt, record.nextAt].filter((date): date is number => date !== null)
    const next = dates.length ? Math.min(...dates) : null
    const date = next === null ? (record.completedAt ? 'Завершено' : 'Ожидает решения') : new Date(next).toLocaleString('ru-RU', { timeZone: 'Asia/Yekaterinburg' }) + ' UTC+5'
    const keyboard = new InlineKeyboard().text('Редактировать', `rm:e:${id}:${record.token}`).text('Удалить', `rm:d:${id}:${record.token}`).row()
    if (!record.completedAt) keyboard.text('Завершить', `rm:f:${id}:${record.token}`).text('Продолжить', `rm:c:${id}:${record.token}`)
    else if (record.expenseDecision === 'pending' || record.expenseDecision === 'yes') keyboard.text('Записать расход', `rm:y:${id}:${record.token}`).text('Нет', `rm:n:${id}:${record.token}`)
    await ctx.answerCallbackQuery()
    await ctx.reply(`${record.text}\nКатегория: ${record.category || 'Не выбрана'}\n${REPEATS[record.repeat]}\nБлижайшая отправка: ${date}`, {
      reply_markup: keyboard,
    })
    return
  }
  if (!token || token !== record.token) {
    await ctx.answerCallbackQuery('Кнопка устарела. Откройте /reminders')
    return
  }
  if (action === 'e') {
    ctx.session.reminderDraft = { id, token }
    ctx.session.nextStep = REMINDER_STEPS.TEXT
    await ctx.answerCallbackQuery()
    await ctx.reply(`Текущий текст: ${record.text}\nВведите новый текст. Затем выберите режим и дату заново.`, { reply_markup: { remove_keyboard: true } })
    return
  }
  if (action === 'd') {
    await ctx.answerCallbackQuery()
    await ctx.reply(`Удалить «${record.text}»?`, { reply_markup: new InlineKeyboard().text('Удалить', `rm:x:${id}:${token}`).text('Отмена', `rm:v:${id}`) })
    return
  }
  const guarded = { ...filter, token, lockUntil: { $lte: Date.now() } }
  if (action === 'n' && record.expenseDecision !== 'pending') {
    await ctx.answerCallbackQuery('Решение уже принято. Откройте /reminders')
    return
  }
  if (action === 'f' && !record.completedAt) {
    const newToken = randomBytes(6).toString('hex')
    const result = await ctx.db.reminders.updateOne(guarded, { $set: { completedAt: Date.now(), nextAt: null, snoozeAt: null, token: newToken, expenseDecision: 'pending', expenseId: new ObjectId().toHexString() } })
    await ctx.answerCallbackQuery(result.matchedCount ? 'Завершено' : 'Запись изменилась. Откройте её заново.')
    if (result.matchedCount) await ctx.reply('Записать трату в расходы на день завершения?', { reply_markup: new InlineKeyboard().text('Да', `rm:y:${id}:${newToken}`).text('Нет', `rm:n:${id}:${newToken}`) })
    return
  }
  if ((action === 'y' || action === 'n') && record.completedAt && (record.expenseDecision === 'pending' || record.expenseDecision === 'yes')) {
    const result = await ctx.db.reminders.updateOne({ ...guarded, expenseDecision: record.expenseDecision }, { $set: { expenseDecision: action === 'y' ? 'yes' : 'no' } })
    await ctx.answerCallbackQuery(result.matchedCount ? (action === 'y' ? 'Введите данные расхода' : 'Без записи расхода') : 'Запись изменилась')
    if (result.matchedCount && action === 'y' && record.expenseId) await startReminderExpense(ctx, id, record.expenseId, record.category)
    return
  }
  if (action === 'c' && !record.completedAt) {
    if (record.repeat === 'once') {
      ctx.session.reminderDraft = { id, token, text: record.text, repeat: record.repeat }
      await ctx.answerCallbackQuery()
      await chooseTerm(ctx)
    }
    else {
      const result = await ctx.db.reminders.updateOne(guarded, { $set: { nextAt: nextDate(record, Date.now()), snoozeAt: null, token: randomBytes(6).toString('hex') } })
      await ctx.answerCallbackQuery(result.matchedCount ? 'Продолжу по расписанию' : 'Запись изменилась')
    }
    return
  }
  if (action === 'x') {
    const result = await ctx.db.reminders.deleteOne(guarded)
    await ctx.answerCallbackQuery(result.deletedCount ? 'Удалено' : 'Запись изменилась или отправляется. Попробуйте позже.')
    return
  }
  if (action === 's' && !record.completedAt) {
    const result = await ctx.db.reminders.updateOne(guarded, { $set: { snoozeAt: Date.now() + 3_600_000, token: randomBytes(6).toString('hex'), retryAt: 0 } })
    await ctx.answerCallbackQuery(result.matchedCount ? 'Напомню через час' : 'Кнопка устарела или отправка ещё завершается')
    return
  }
  await ctx.answerCallbackQuery('Неизвестное действие')
})

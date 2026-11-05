import { randomBytes } from 'node:crypto'
import { Keyboard } from 'grammy'
import { ObjectId } from 'mongodb'
import type { MyContext } from '../../../types/context.ts'
import type { Reminder } from '../../../types/db/reminder.ts'
import { firstDate, relativeDate } from '../../../services/reminders/schedule.ts'
import { REMINDER_STEPS, REPEATS, TERMS } from './constants.ts'

export const reminderCallbacks = {
  [REMINDER_STEPS.TEXT]: textInput,
  [REMINDER_STEPS.REPEAT]: repeatInput,
  [REMINDER_STEPS.DATE]: dateInput,
  [REMINDER_STEPS.TERM]: termInput,
  [REMINDER_STEPS.CATEGORY]: categoryInput,
}

export async function chooseTerm(ctx: MyContext) {
  ctx.session.nextStep = REMINDER_STEPS.TERM
  const keyboard = new Keyboard().resized().oneTime()
  TERMS.forEach(term => keyboard.text(term).row())
  await ctx.reply('Когда напомнить? Время отправки — 15:00 UTC+5.', { reply_markup: keyboard })
}

async function termInput(ctx: MyContext) {
  const term = ctx.message?.text || ''
  if (term === 'Произвольная дата') {
    ctx.session.nextStep = REMINDER_STEPS.DATE
    await ctx.reply('Введите дату: дд.мм.гггг', { reply_markup: { remove_keyboard: true } })
    return
  }
  const date = relativeDate(term)
  if (!date) {
    await ctx.reply('Выберите срок с клавиатуры')
    return
  }
  await acceptDate(ctx, date)
}

async function textInput(ctx: MyContext) {
  const text = ctx.message!.text!.trim()
  if (!text || text.length > 1000) {
    await ctx.reply('Введите текст от 1 до 1000 символов')
    return
  }
  ctx.session.reminderDraft = { ...ctx.session.reminderDraft, text }
  ctx.session.nextStep = REMINDER_STEPS.REPEAT
  const keyboard = new Keyboard().resized().oneTime()
  Object.values(REPEATS).forEach(label => keyboard.text(label).row())
  await ctx.reply('Выберите повторение', { reply_markup: keyboard })
}

async function repeatInput(ctx: MyContext) {
  const repeat = (Object.keys(REPEATS) as Array<Reminder['repeat']>).find(key => REPEATS[key] === ctx.message?.text)
  if (!repeat) {
    await ctx.reply('Выберите режим с клавиатуры')
    return
  }
  ctx.session.reminderDraft = { ...ctx.session.reminderDraft, repeat }
  await chooseTerm(ctx)
}

async function dateInput(ctx: MyContext) {
  const date = (ctx.message?.text || '').trim()
  await acceptDate(ctx, date)
}

async function acceptDate(ctx: MyContext, date: string) {
  const nextAt = firstDate(date)
  if (!Number.isFinite(nextAt) || nextAt <= Date.now()) {
    await ctx.reply('Введите реальную будущую дату в формате дд.мм.гггг (время отправки — 15:00 UTC+5)')
    return
  }
  const draft = ctx.session.reminderDraft
  if (!draft?.text || !draft.repeat) {
    ctx.session.nextStep = ''
    await ctx.reply('Начните заново: /reminders')
    return
  }
  ctx.session.reminderDraft = { ...draft, date }
  ctx.session.nextStep = REMINDER_STEPS.CATEGORY
  const keyboard = new Keyboard().resized().oneTime()
  ctx.db.categories.forEach(category => keyboard.text(category).row())
  await ctx.reply('Выберите категорию траты', { reply_markup: keyboard })
}

async function categoryInput(ctx: MyContext) {
  const category = ctx.message?.text || ''
  if (!ctx.db.categories.includes(category)) {
    await ctx.reply('Выберите существующую категорию')
    return
  }
  const draft = ctx.session.reminderDraft
  if (!draft?.text || !draft.repeat || !draft.date) {
    await ctx.reply('Начните заново: /reminders')
    return
  }
  const nextAt = firstDate(draft.date)
  if (nextAt <= Date.now()) {
    await chooseTerm(ctx)
    return
  }
  const value = { text: draft.text, repeat: draft.repeat, category, date: draft.date, nextAt, snoozeAt: null, completedAt: null, token: randomBytes(6).toString('hex'), lockUntil: 0, retryAt: 0 }
  if (draft.id) {
    const result = await ctx.db.reminders.updateOne({ _id: new ObjectId(draft.id), from: ctx.from!.id, ...(draft.token ? { token: draft.token } : {}), lockUntil: { $lte: Date.now() } }, { $set: value })
    if (!result.matchedCount) {
      await ctx.reply('Запись удалена или сейчас отправляется. Повторите через минуту: /reminders')
      return
    }
  }
  else {
    await ctx.db.reminders.insertOne({ ...value, from: ctx.from!.id, createdAt: Date.now() })
  }
  delete ctx.session.reminderDraft
  ctx.session.nextStep = ''
  await ctx.reply('Напоминание сохранено. /reminders')
}

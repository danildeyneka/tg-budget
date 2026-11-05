import { Keyboard } from 'grammy'
import { ObjectId } from 'mongodb'
import { PARTNER_TYPES_NAMES } from '../../../constants/partners.ts'
import { dateFormatter } from '../../../helpers/date.ts'
import type { MyContext } from '../../../types/context.ts'
import { REMINDER_STEPS } from './constants.ts'

export const reminderExpenseCallbacks = {
  [REMINDER_STEPS.EXPENSE_CATEGORY]: categoryInput,
  [REMINDER_STEPS.SUM]: sumInput,
  [REMINDER_STEPS.TYPE]: typeInput,
}

export async function startReminderExpense(ctx: MyContext, id: string, expenseId: string, category?: string) {
  ctx.session.reminderExpense = { id, expenseId }
  if (category && ctx.db.categories.includes(category)) {
    ctx.session.reminderExpense.category = category
    ctx.session.nextStep = REMINDER_STEPS.SUM
    await ctx.reply('Введите сумму расхода', { reply_markup: { remove_keyboard: true } })
  }
  else {
    ctx.session.nextStep = REMINDER_STEPS.EXPENSE_CATEGORY
    const keyboard = new Keyboard().resized().oneTime()
    ctx.db.categories.forEach(item => keyboard.text(item).row())
    await ctx.reply('Выберите категорию расхода', { reply_markup: keyboard })
  }
}

async function categoryInput(ctx: MyContext) {
  const category = ctx.message?.text || ''
  if (!ctx.db.categories.includes(category) || !ctx.session.reminderExpense) {
    await ctx.reply('Выберите существующую категорию')
    return
  }
  ctx.session.reminderExpense.category = category
  ctx.session.nextStep = REMINDER_STEPS.SUM
  await ctx.reply('Введите сумму расхода', { reply_markup: { remove_keyboard: true } })
}

async function sumInput(ctx: MyContext) {
  const sum = Number((ctx.message?.text || '').trim().replace(',', '.'))
  if (!Number.isFinite(sum) || sum <= 0 || !Number.isSafeInteger(Math.round(sum)) || Math.round(sum) <= 0 || !ctx.session.reminderExpense) {
    await ctx.reply('Введите положительную сумму')
    return
  }
  ctx.session.reminderExpense.sum = Math.round(sum)
  ctx.session.nextStep = REMINDER_STEPS.TYPE
  const keyboard = new Keyboard().resized().oneTime()
  Object.values(PARTNER_TYPES_NAMES).forEach(label => keyboard.text(label).row())
  await ctx.reply('Выберите тип траты', { reply_markup: keyboard })
}

async function typeInput(ctx: MyContext) {
  const type = Object.entries(PARTNER_TYPES_NAMES).find(([, label]) => label === ctx.message?.text)?.[0]
  if (!type) {
    await ctx.reply('Выберите тип траты с клавиатуры')
    return
  }
  const draft = ctx.session.reminderExpense
  if (!draft?.category || !draft.sum) {
    await ctx.reply('Откройте напоминание заново: /reminders')
    return
  }
  const reminder = await ctx.db.reminders.findOne({ _id: new ObjectId(draft.id), from: ctx.from!.id, expenseDecision: 'yes', expenseId: draft.expenseId })
  if (!reminder?.completedAt || !reminder.expenseId) {
    ctx.session.nextStep = ''
    delete ctx.session.reminderExpense
    await ctx.reply('Напоминание изменено или расход уже записан')
    return
  }
  // The stored expense ID makes retries idempotent, including after a process restart.
  await ctx.db.expenses.updateOne({ _id: new ObjectId(reminder.expenseId) }, { $setOnInsert: {
    from: ctx.from!.id, category: draft.category, sum: draft.sum, for: type,
    date: dateFormatter(new Date(reminder.completedAt)), comment: reminder.text, createdAt: Date.now(),
  } }, { upsert: true })
  await ctx.db.reminders.updateOne({ _id: reminder._id, from: ctx.from!.id, expenseId: reminder.expenseId }, { $set: { expenseDecision: 'recorded' } })
  ctx.session.nextStep = ''
  delete ctx.session.reminderExpense
  await ctx.reply('Расход записан на день завершения напоминания', { reply_markup: { remove_keyboard: true } })
}

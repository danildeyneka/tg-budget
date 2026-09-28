import { Composer, Keyboard } from 'grammy'
import { COMMANDS } from '../../../../constants/commands.ts'
import { PARTNER_TYPES_NAMES } from '../../../../constants/partners.ts'
import { RUBLE } from '../../../../constants/common.ts'
import type { MyContext } from '../../../../types/context.ts'
import { loadCallbacks } from '../../../callbacks/index.ts'
import { EDIT_EXPENSE_STEPS } from './constants.ts'
import { editExpenseCallbacks } from './edit-expense.router.ts'

export const editExpenseComposer = new Composer<MyContext>()

editExpenseComposer.command(COMMANDS.EDIT_EXPENSE, async (ctx, next) => {
  const expense = await ctx.db.expenses.find({ from: ctx.from!.id })
    .sort({ _id: -1 })
    .limit(1)
    .next()

  if (!expense) {
    ctx.session.editExpenseId = ''
    ctx.session.editExpenseField = ''
    ctx.session.nextStep = ''
    await ctx.reply('У вас пока нет расходов для редактирования')
    return await next()
  }

  ctx.session.editExpenseId = expense._id.toHexString()
  ctx.session.editExpenseField = ''
  ctx.session.nextStep = EDIT_EXPENSE_STEPS.FIELD

  const keyboard = new Keyboard().oneTime().resized()
  keyboard.text('Категория').text('Тип траты').row()
    .text('Сумма').text('Дата').row()
    .text('Комментарий')

  const partnerType = Object.entries(PARTNER_TYPES_NAMES)
    .find(([key]) => key === expense.for)?.[1] || expense.for || 'не указан'
  const summary = [
    `${expense.sum ?? 'не указана'}${RUBLE}`,
    expense.category || 'без категории',
    partnerType,
    expense.date || 'без даты',
  ].join(' | ')

  await ctx.reply(`Последняя трата: ${summary}\nЧто изменить?`, {
    reply_markup: keyboard,
  })

  await next()
})

loadCallbacks(editExpenseCallbacks)

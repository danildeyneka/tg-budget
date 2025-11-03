import { Composer, Keyboard } from 'grammy'
import { COMMANDS } from '../../../../constants/commands.ts'
import type { MyContext } from '../../../../types/context.ts'
import { loadCallbacks } from '../../../callbacks/index.ts'
import { ALL_CATEGORIES, SHOW_EXPENSES_STEPS } from './constants.ts'
import { totalExpensesCallbacks } from './total-expenses.router.ts'

export const totalExpensesComposer = new Composer<MyContext>()

totalExpensesComposer.command(
  COMMANDS.SHOW_EXPENSES,
  async (ctx, next) => {
    ctx.session.totalExpenses = []
    ctx.session.totalExpenses = await ctx.db.expenses.find({}).toArray()
    const allExpenses = ctx.session.totalExpenses

    if (allExpenses.length === 0) {
      await ctx.reply('У вас пока нет записей о расходах')
      return
    }

    const catKeyboard = new Keyboard().oneTime().add(ALL_CATEGORIES).row()

    ctx.db.categories.forEach((cat, i) => {
      catKeyboard.text(cat)

      if ((i + 1) % 3 === 0) catKeyboard.row()
    })

    await ctx.reply('Выберите статистику по категории', {
      reply_markup: catKeyboard,
    })

    ctx.session.nextStep = SHOW_EXPENSES_STEPS.CATEGORY

    await next()
  },
)

loadCallbacks(totalExpensesCallbacks)

import { Composer, Keyboard } from 'grammy'
import { COMMANDS } from '../../../../constants/commands.ts'
import type { MyContext } from '../../../../types/context.ts'
import { loadCallbacks } from '../../../callbacks/index.ts'
import { SHOW_EXPENSES_NAMES } from '../total/constants.ts'
import { GRAPH_EXPENSES_STEPS } from './constants.ts'
import { graphExpensesCallbacks } from './graph-expenses.router.ts'

export const graphExpensesComposer = new Composer<MyContext>()

graphExpensesComposer.command(
  COMMANDS.EXPENSES_GRAPH,
  async (ctx, next) => {
    ctx.session.totalExpenses = await ctx.db.expenses.find({}).toArray()

    if (ctx.session.totalExpenses.length === 0) {
      await ctx.reply('У вас пока нет записей о расходах')
      return
    }

    const periodKeyboard = new Keyboard().oneTime().resized()

    Object.values(SHOW_EXPENSES_NAMES).forEach((name, i) => {
      periodKeyboard.text(name)
      if ((i + 1) % 3 === 0) periodKeyboard.row()
    })

    await ctx.reply('Выберите период для графика расходов', {
      reply_markup: periodKeyboard,
    })

    ctx.session.nextStep = GRAPH_EXPENSES_STEPS.PERIOD

    await next()
  },
)

loadCallbacks(graphExpensesCallbacks)

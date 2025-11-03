import { Composer, Keyboard } from 'grammy'
import { COMMANDS } from '../../../../constants/commands.ts'
import type { MyContext } from '../../../../types/context.ts'
import { loadCallbacks } from '../../../callbacks/index.ts'
import { addExpenseCallbacks } from './add-expense.router.ts'
import { ADD_EXPENSE_STEPS } from './constants.ts'

export const addExpenseComposer = new Composer<MyContext>()

addExpenseComposer.command(
  COMMANDS.ADD_EXPENSE,
  async (ctx, next) => {
    const catKeyboard = new Keyboard().oneTime()

    ctx.db.categories.forEach((cat, i) => {
      catKeyboard.text(cat)

      if (i % 2) catKeyboard.row()
    })

    await ctx.reply(
      'Выберите категорию расхода',
      { reply_markup: catKeyboard },
    )

    ctx.session.nextStep = ADD_EXPENSE_STEPS.CATEGORY
    await next()
  },
)

loadCallbacks(addExpenseCallbacks)

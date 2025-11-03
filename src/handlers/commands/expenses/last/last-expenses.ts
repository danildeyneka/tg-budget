import { Composer } from 'grammy'
import { COMMANDS } from '../../../../constants/commands.ts'
import { RUBLE } from '../../../../constants/common.ts'
import { PARTNER_TYPES_NAMES } from '../../../../constants/partners.ts'
import type { MyContext } from '../../../../types/context.ts'
import type { Expense } from '../../../../types/db/expense.ts'

const EXPENSES_LIMIT = 5

export const lastExpensesComposer = new Composer<MyContext>()

lastExpensesComposer.command(COMMANDS.LAST_EXPENSES, async (ctx, next) => {
  const lastExpenses = await ctx.db.expenses.find({ from: ctx.from!.id }).sort({ _id: -1 }).limit(EXPENSES_LIMIT).toArray()

  await ctx.reply(formatExpensesTable(lastExpenses), {
    parse_mode: 'HTML',
  })
  await next()
})

function formatExpensesTable(expenses: Array<Expense>) {
  let message = ''
  let total = 0
  message += `${'-'.repeat(7)} Последние 5 расходов ${'-'.repeat(7)}\n`

  expenses.forEach((expense) => {
    const date = expense.date
    const category = expense.category
    const sum = expense.sum
    const forWhom = PARTNER_TYPES_NAMES[expense.for!]

    message += `${date} | <i>${forWhom}</i> | <b>${sum}</b> | ${category}\n`

    total += sum!
  })

  return message += `${'-'.repeat(12)} Всего: <b>${total}</b>${RUBLE} ${'-'.repeat(12)}\n`
}

import { Composer, Keyboard } from 'grammy'
import { COMMANDS } from '../../../../constants/commands.ts'
import { RUBLE } from '../../../../constants/common.ts'
import { PARTNER_TYPES_NAMES } from '../../../../constants/partners.ts'
import type { MyContext } from '../../../../types/context.ts'
import type { Expense } from '../../../../types/db/expense.ts'
import { loadCallbacks } from '../../../callbacks/index.ts'

const EXPENSES_LIMIT = 10
const MINE = 'Мои'
const PARTNER = 'Партнера'

export const lastExpensesComposer = new Composer<MyContext>()

const lastExpenseCallbacks = {
  [COMMANDS.LAST_EXPENSES]: selectFrom,
}

loadCallbacks(lastExpenseCallbacks)

lastExpensesComposer.command(COMMANDS.LAST_EXPENSES, async (ctx, next) => {
  const expensesKbd = new Keyboard().oneTime().resized()
    .text(MINE).text(PARTNER).row()

  await ctx.reply(
    'Выберите вид расходов',
    {
      reply_markup: expensesKbd,
    },
  )
  ctx.session.nextStep = COMMANDS.LAST_EXPENSES

  await next()
})

async function selectFrom(ctx: MyContext) {
  const from = ctx.message?.text === MINE ? ctx.from!.id : Number((process.env.ALLOWED_USERS || '').split(',').filter(id => +id !== ctx.from!.id)[0])
  const lastExpenses = await ctx.db.expenses.find({ from: from }).sort({ _id: -1 }).limit(EXPENSES_LIMIT).toArray()

  ctx.session.nextStep = ''

  await ctx.reply(formatExpensesTable(lastExpenses), {
    parse_mode: 'HTML',
  })
}

function formatExpensesTable(expenses: Array<Expense>) {
  let message = `${'-'.repeat(7)} Последние 10 расходов ${'-'.repeat(7)}\n`
  let total = 0

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

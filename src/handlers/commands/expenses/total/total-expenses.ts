import { Composer, Keyboard } from 'grammy'
import {
  PARTNER_TYPES,
  PARTNER_TYPES_NAMES,
} from '../../../../constants/partners.ts'
import { parseDate } from '../../../../helpers/date.ts'
import type { MyContext } from '../../../../types/context.ts'
import { loadCallbacks } from '../../../callbacks/index.ts'
import { SHOW_EXPENSES_NAMES, SHOW_EXPENSES_STEP } from './constants.ts'
import { createTotalExpensesRow, getPeriodStart } from './helpers.ts'

export const totalExpensesComposer = new Composer<MyContext>()

totalExpensesComposer.command(
  'total_expenses',
  async (ctx, next) => {
    ctx.session.totalExpenses = []
    ctx.session.totalExpenses = await ctx.db.expenses.find({}).toArray()
    const allExpenses = ctx.session.totalExpenses

    if (allExpenses.length === 0) {
      await ctx.reply('У вас пока нет записей о расходах')
      return
    }

    const periodKeyboard = new Keyboard().oneTime()
      .resized()
    Object.values(SHOW_EXPENSES_NAMES).forEach((name, i) => {
      periodKeyboard.text(name)
      if ((i + 1) % 3 === 0) periodKeyboard.row()
    })

    await ctx.reply('Выберите период трат', { reply_markup: periodKeyboard })
    ctx.session.nextStep = SHOW_EXPENSES_STEP

    await next()
  },
)

async function showTotalExpenses(ctx: MyContext) {
  const allExpenses = ctx.session.totalExpenses
  const period = ctx.message?.text || ''

  if (!Object.values(SHOW_EXPENSES_NAMES).includes(period)) {
    await ctx.reply('Выберите период из списка')
  }

  const periodStart = getPeriodStart(period)

  const total: Record<string, number> = {
    [PARTNER_TYPES.TOGETHER]: 0,
    [PARTNER_TYPES.PARTNER]: 0,
    [PARTNER_TYPES.MYSELF]: 0,
  }
  const totalMine: Record<string, number> = { ...total }
  let totalSum = 0
  let totalMineSum = 0

  allExpenses.forEach((el) => {
    if (parseDate(el.date!) <= periodStart) return
    const forWhom = el.for!
    const sum = el.sum!

    // total sum
    totalSum += sum
    total[forWhom]! += sum

    // user sum
    if (el.from === ctx.from!.id) {
      totalMineSum += sum
      totalMine[forWhom]! += sum
    }
  })

  let table = `<b>Статистика расходов</b>\n${createTotalExpensesRow(
    'Всего',
    totalSum,
    totalMineSum,
  )}`
  Object.entries(total).forEach(([
    name,
    sum,
  ]) => table += createTotalExpensesRow(
    PARTNER_TYPES_NAMES[name]!,
    sum,
    totalMine[name]!,
  ))

  await ctx.reply(
    table,
    {
      parse_mode: 'HTML',
    },
  )
}

const totalExpensesCallbacks = {
  [SHOW_EXPENSES_STEP]: showTotalExpenses,
}

loadCallbacks(totalExpensesCallbacks)

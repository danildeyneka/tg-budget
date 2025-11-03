import { Keyboard } from 'grammy'
import {
  PARTNER_TYPES,
  PARTNER_TYPES_NAMES,
} from '../../../../constants/partners.ts'
import { parseDate } from '../../../../helpers/date.ts'
import type { MyContext } from '../../../../types/context.ts'
import {
  ALL_CATEGORIES,
  SHOW_EXPENSES_NAMES,
  SHOW_EXPENSES_STEPS,
} from './constants.ts'
import { createTotalExpensesRow, getPeriodStart } from './helpers.ts'

let tempCategory = ''

export const totalExpensesCallbacks = {
  [SHOW_EXPENSES_STEPS.CATEGORY]: selectVariant,
  [SHOW_EXPENSES_STEPS.PERIOD]: selectPeriod,
}

async function selectVariant(ctx: MyContext) {
  const variant = ctx.message?.text || ''
  const categories = ctx.db.categories.concat(ALL_CATEGORIES)

  if (!categories.includes(variant)) {
    await ctx.reply('Выберите вариант из предложенных')
  }
  tempCategory = variant

  const periodKeyboard = new Keyboard().oneTime().resized()

  Object.values(SHOW_EXPENSES_NAMES).forEach((name, i) => {
    periodKeyboard.text(name)
    if ((i + 1) % 3 === 0) periodKeyboard.row()
  })

  await ctx.reply('Выберите период трат', { reply_markup: periodKeyboard })
  ctx.session.nextStep = SHOW_EXPENSES_STEPS.PERIOD
}

async function selectPeriod(ctx: MyContext) {
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
    if (tempCategory !== ALL_CATEGORIES && el.category !== tempCategory) return
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

  let table = `<b>Статистика расходов:</b>\n<i>${tempCategory}</i>\n${createTotalExpensesRow(
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

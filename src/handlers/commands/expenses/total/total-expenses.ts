import { Composer } from 'grammy'
import { RUBLE } from '../../../../constants/common.ts'
import {
  PARTNER_TYPES,
  PARTNER_TYPES_NAMES,
} from '../../../../constants/partners.ts'
import type { MyContext } from '../../../../types/context.ts'

export const totalExpensesComposer = new Composer<MyContext>()

totalExpensesComposer.command(
  'total_expenses',
  async (ctx, next) => {
    const allExpenses = await ctx.db.expenses.find({}).toArray()

    if (allExpenses.length === 0) {
      await ctx.reply('У вас пока нет записей о расходах')
      return
    }

    const total: Record<string, number> = {
      [PARTNER_TYPES.TOGETHER]: 0,
      [PARTNER_TYPES.PARTNER]: 0,
      [PARTNER_TYPES.MYSELF]: 0,
    }
    const totalMine: Record<string, number> = { ...total }
    let totalSum = 0
    let totalMineSum = 0

    allExpenses.forEach((el) => {
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

    let table = `<b>Статистика расходов</b>\n${createTableRow(
      'Всего',
      totalSum,
      totalMineSum,
    )}`
    Object.entries(total).forEach(([
      name,
      sum,
    ]) => table += createTableRow(
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

    await next()
  },
)

function createTableRow(rowName: string, sum: number, mineSum: number) {
  return `${'-'.repeat(35)}\n<b>${rowName}: </b><code>${sum}${RUBLE}</code>\n\n<i>Ваши - </i><b><code>${mineSum}${RUBLE}</code></b>\n<i>Партнер - </i> <code>${sum - mineSum}${RUBLE}</code>\n`
}

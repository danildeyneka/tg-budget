import { RUBLE } from '../../../../constants/common.ts'
import { SHOW_EXPENSES_NAMES, SHOW_EXPENSES_TYPES } from './constants.ts'

export const createTotalExpensesRow = (rowName: string, sum: number, mineSum: number) =>
  `${'-'.repeat(35)}\n<b>${rowName}: </b><code>${sum}${RUBLE}</code>\n\n<i>Ваши - </i><b><code>${mineSum}${RUBLE}</code></b>\n<i>Партнер - </i> <code>${sum - mineSum}${RUBLE}</code>\n`

export const getPeriodStart = (period: string): number => {
  const date = new Date()

  switch (period) {
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.DAY]:
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.TWO_DAYS]:
      date.setDate(date.getDate() - 1)
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.WEEK]:
      date.setDate(date.getDate() - 6)
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.TWO_WEEKS]:
      date.setDate(date.getDate() - 13)
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.MONTH]:
      return new Date(date.getFullYear(), date.getMonth(), 1).getTime()
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.QUARTER]:
      return new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1).getTime()
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.HALF_YEAR]:
      return new Date(date.getFullYear(), date.getMonth() < 6 ? 0 : 6, 1).getTime()
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.YEAR]:
      return new Date(date.getFullYear(), 0, 1).getTime()
    default:
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  }
}

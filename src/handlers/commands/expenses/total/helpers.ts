import { RUBLE } from '../../../../constants/common.ts'
import { SHOW_EXPENSES_NAMES, SHOW_EXPENSES_TYPES } from './constants.ts'

export const createTotalExpensesRow = (rowName: string, sum: number, mineSum: number) =>
  `${'-'.repeat(35)}\n<b>${rowName}: </b><code>${sum}${RUBLE}</code>\n\n<i>Ваши - </i><b><code>${mineSum}${RUBLE}</code></b>\n<i>Партнер - </i> <code>${sum - mineSum}${RUBLE}</code>\n`

export const getPeriodStart = (period: string): number => {
  const date = new Date()

  switch (period) {
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.DAY]:
      date.setDate(date.getDate() - 1)
      break
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.TWO_DAYS]:
      date.setDate(date.getDate() - 2)
      break
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.WEEK]:
      date.setDate(date.getDate() - 7)
      break
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.TWO_WEEKS]:
      date.setDate(date.getDate() - 14)
      break
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.MONTH]:
      date.setDate(date.getDate() - 30)
      break
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.QUARTER]:
      date.setDate(date.getDate() - 92)
      break
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.HALF_YEAR]:
      date.setDate(date.getDate() - 183)
      break
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.YEAR]:
      date.setDate(date.getDate() - 365)
      break
    case SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.TOTAL]:
      return new Date(date.getFullYear() - 10, 0, 1).getTime()
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

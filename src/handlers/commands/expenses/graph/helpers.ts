import { parseDate } from '../../../../helpers/date.ts'
import type { Expense } from '../../../../types/db/expense.ts'
import { getPeriodStart } from '../total/helpers.ts'

export type CategoryExpenseChartRow = {
  category: string
  sum: number
}

export const buildCategoryExpenseChartData = (
  expenses: Expense[],
  period: string,
  baseDate = new Date(),
): CategoryExpenseChartRow[] => {
  const periodStart = getPeriodStart(
    period,
    baseDate,
  )
  const totals = new Map<string, number>()

  expenses.forEach((expense) => {
    if (!expense.category || !expense.sum || !expense.date) return
    if (parseDate(expense.date) <= periodStart) return

    totals.set(
      expense.category,
      (totals.get(expense.category) || 0) + expense.sum,
    )
  })

  return Array.from(totals.entries())
    .map(([category, sum]) => ({ category,
      sum }))
    .sort((a, b) => b.sum - a.sum)
}

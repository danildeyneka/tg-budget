import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SHOW_EXPENSES_NAMES, SHOW_EXPENSES_TYPES } from '../src/handlers/commands/expenses/total/constants.ts'
import { buildCategoryExpenseChartData } from '../src/handlers/commands/expenses/graph/helpers.ts'
import type { Expense } from '../src/types/db/expense.ts'

describe('buildCategoryExpenseChartData', () => {
  it('aggregates expenses by category for selected period', () => {
    const now = new Date(2026, 6, 5)
    const expenses: Expense[] = [
      { category: 'Еда', sum: 1000, date: '05.07.2026' },
      { category: 'Еда', sum: 500, date: '04.07.2026' },
      { category: 'Такси', sum: 700, date: '05.07.2026' },
      { category: 'Кофе', sum: 0, date: '05.07.2026' },
      { category: 'Путешествия', sum: 3000, date: '01.01.2026' },
      { sum: 400, date: '05.07.2026' },
      { category: 'Без даты', sum: 400 },
    ]

    const data = buildCategoryExpenseChartData(
      expenses,
      SHOW_EXPENSES_NAMES[SHOW_EXPENSES_TYPES.WEEK]!,
      now,
    )

    assert.deepEqual(
      data,
      [
        { category: 'Еда', sum: 1500 },
        { category: 'Такси', sum: 700 },
      ],
    )
  })
})

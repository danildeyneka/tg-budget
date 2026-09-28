import { Composer } from 'grammy'
import type { MyContext } from '../../../types/context.ts'
import { addExpenseComposer } from './add/add-expense.ts'
import { editExpenseComposer } from './edit/edit-expense.ts'
import { graphExpensesComposer } from './graph/graph-expenses.ts'
import { lastExpensesComposer } from './last/last-expenses.ts'
import { totalExpensesComposer } from './total/total-expenses.ts'

export const expensesComposer = new Composer<MyContext>()

expensesComposer.use(addExpenseComposer)
expensesComposer.use(editExpenseComposer)
expensesComposer.use(totalExpensesComposer)
expensesComposer.use(graphExpensesComposer)
expensesComposer.use(lastExpensesComposer)

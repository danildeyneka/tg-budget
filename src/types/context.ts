import { Context } from 'grammy'
import type { Collection, WithId } from 'mongodb'
import type { Categories } from './db/categories.ts'
import type { WithData } from './db/common.ts'
import type { Expense } from './db/expense.ts'
import type { User } from './db/users.ts'
import type { Reminder } from './db/reminder.ts'

type Database = {
  users: Collection<User>
  expenses: Collection<Expense>
  reminders: Collection<Reminder>
  categories: Categories
  categoriesWorker: Collection<WithData<Categories>>
}

export type MyContext = Context & {
  db: Database
  session: {
    expense: Expense
    totalExpenses: Array<WithId<Expense>>
    editExpenseId: string
    editExpenseField: string
    nextStep: string
    reminderDraft?: { id?: string, text?: string, repeat?: Reminder['repeat'], date?: string, category?: string, token?: string }
    reminderExpense?: { id: string, expenseId: string, category?: string, sum?: number }
  }
}

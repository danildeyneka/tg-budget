import { Context } from 'grammy'
import type { Collection, WithId } from 'mongodb'
import type { Categories } from './db/categories.ts'
import type { WithData } from './db/common.ts'
import type { Expense } from './db/expense.ts'
import type { User } from './db/users.ts'

type Database = {
  users: Collection<User>
  expenses: Collection<Expense>
  categories: Categories
  categoriesWorker: Collection<WithData<Categories>>
}

export type MyContext = Context & {
  db: Database
  session: {
    expense: Expense
    totalExpenses: Array<WithId<Expense>>
    nextStep: string
  }
}

import { Composer } from 'grammy'
import { loadComposers } from '../../helpers/composers.ts'
import type { MyContext } from '../../types/context.ts'
import type { Categories } from '../../types/db/categories.ts'
import type { WithData } from '../../types/db/common.ts'
import type { Expense } from '../../types/db/expense.ts'
import type { User } from '../../types/db/users.ts'
import { categoriesServiceComposer } from './categories.ts'
import { mongoDb } from './mongo.ts'

export const databaseComposer = new Composer<MyContext>()

const composers = [categoriesServiceComposer]

databaseComposer.use(async (ctx, next) => {
  const db = mongoDb.db(process.env.MONGODB_DATABASE_NAME)
  const users = db.collection<User>('users')
  const expenses = db.collection<Expense>('expenses')

  const categoriesWorker = db.collection<WithData<Categories>>('categories')

  ctx.db = {
    users, expenses, categoriesWorker, categories: [],
  }

  await next()
})

loadComposers(
  databaseComposer,
  composers,
)

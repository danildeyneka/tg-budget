import { Composer, session } from 'grammy'
import type { WithId } from 'mongodb'
import type { MyContext } from '../../types/context.ts'
import type { Expense } from '../../types/db/expense.ts'

export const sessionComposer = new Composer<MyContext>()

sessionComposer.use(session({
  initial: () => ({
    expense: {},
    totalExpenses: [] as Array<WithId<Expense>>,
    nextStep: '',
  }),
}))

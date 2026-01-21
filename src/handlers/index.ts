import { Composer } from 'grammy'
import { accessComposer } from '../core/middleware/access.ts'
import { sessionComposer } from '../core/middleware/session.ts'
import { databaseComposer } from '../services/database/connector.ts'
import type { MyContext } from '../types/context.ts'
import { routerComposer } from './callbacks/index.ts'
import { categoriesComposer } from './commands/categories.ts'
import { expensesComposer } from './commands/expenses/index.ts'
import { startComposer } from './commands/start.ts'

export const botComposers: Array<Composer<MyContext>> = [
  accessComposer,
  databaseComposer,
  categoriesComposer,
  sessionComposer,
  routerComposer,

  startComposer,
  expensesComposer,
]

import { type Composer } from 'grammy'
import { allowedAccess } from '../core/middleware/access.ts'
import { sessionComposer } from '../core/middleware/session.ts'
import { databaseComposer } from '../services/database/connector.ts'
import type { MyContext } from '../types/context.ts'
import { routerComposer } from './callbacks/index.ts'
import { expensesComposer } from './commands/expenses/index.ts'
import { startComposer } from './commands/start.ts'

export const botHandlers: Array<Composer<MyContext>> = [
  allowedAccess,
  databaseComposer,
  sessionComposer,
  routerComposer,

  startComposer,
  expensesComposer,
]

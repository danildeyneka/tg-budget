import { Composer, session } from 'grammy'
import type { MyContext } from '../../types/context.ts'

export const sessionComposer = new Composer<MyContext>()

sessionComposer.use(session({
  initial: () => ({
    expense: {},
    nextStep: '',
  }),
}))

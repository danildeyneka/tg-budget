import { Composer } from 'grammy'
import type { MyContext } from '../../types/context.ts'

export const helpComposer = new Composer<MyContext>()

helpComposer.command(
  'help',
  async (ctx, next) => {

  },
)

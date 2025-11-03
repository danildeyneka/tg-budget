import { Composer } from 'grammy'
import type { MyContext } from '../../types/context.ts'

export const accessComposer = new Composer<MyContext>()

accessComposer.use(async (ctx, next) => {
  const allowedUsers = (process.env.ALLOWED_USERS || '').split(',')
  if (allowedUsers.includes(ctx.from?.id + '')) {
    await next()
  }
  else {
    await ctx.reply('User is not allowed')
    return
  }
})

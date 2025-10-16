import { Composer } from 'grammy'
import type { MyContext } from '../../types/context.ts'

export const allowedAccess = new Composer<MyContext>()

allowedAccess.use(async (ctx, next) => {
  const allowedUsers = (process.env.ALLOWED_USERS || '').split(',')
  if (allowedUsers.includes(ctx.from?.id + '')) {
    await next()
  }
  else {
    await ctx.reply('User is not allowed')
    return
  }
})

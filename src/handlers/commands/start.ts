import { Composer } from 'grammy'
import type { MyContext } from '../../types/context.ts'
import type { User } from '../../types/db/users.ts'

export const startComposer = new Composer<MyContext>()

startComposer.command(
  'start',
  async (ctx, next) => {
    const existingUser = await ctx.db.users.findOne({ telegramId: ctx.from!.id })

    if (!existingUser) {
      await ctx.db.users.insertOne({
        telegramId: ctx.from!.id,
        userName: ctx.from!.username,
        firstName: ctx.from!.first_name,
        lastName: ctx.from!.last_name,
        createdAt: new Date(),
      } as User)
    }
    await ctx.reply('Салют!')
    await ctx.react('👏')

    await next()
  },
)

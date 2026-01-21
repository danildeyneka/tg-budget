import { CronJob as Cron, type CronJob } from 'cron'
import { Composer, Keyboard } from 'grammy'
import type { MyContext } from '../types/context.ts'

class NotificationsService {
  private cronJob: CronJob | null = null
  private chats = (process.env.ALLOWED_USERS || '').split(',')
  private cmdKeyboard = new Keyboard().oneTime()
    .resized()
    .text('/add_expense')

  async broadcast(ctx: MyContext) {
    for (const chat of this.chats) {
      await ctx.api.sendMessage(chat, 'Не забудь внести расходы!',
        {
          reply_markup: this.cmdKeyboard,
        })
    }
  }

  start(ctx: MyContext) {
    if (this.cronJob) return

    this.cronJob = new Cron('0 22 * * *', async () => {
      await this.broadcast(ctx)
    }, null, true)
  }

  stop() {
    this.cronJob?.stop()
  }
}

export const notificationsService = new NotificationsService()

export const notificationsServiceComposer = new Composer<MyContext>()

notificationsServiceComposer.use(async (ctx, next) => {
  notificationsService.start(ctx)

  await next()
})

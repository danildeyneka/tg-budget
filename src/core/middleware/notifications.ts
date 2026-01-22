import { CronJob as Cron, type CronJob } from 'cron'
import { Api, type Bot, Keyboard } from 'grammy'
import type { MyContext } from '../../types/context.ts'

class NotificationsService {
  private cronJob: CronJob | null = null
  private chats = (process.env.ALLOWED_USERS || '').split(',')
  private cmdKeyboard = new Keyboard().oneTime()
    .resized()
    .text('/add_expense')

  async broadcast(api: Api) {
    for (const chat of this.chats) {
      await api.sendMessage(chat, 'Не забудь внести расходы!',
        {
          reply_markup: this.cmdKeyboard,
        })
    }
  }

  start(api: Api) {
    if (this.cronJob) return
    this.cronJob = new Cron('0 18 * * *', async () => {
      await this.broadcast(api)
    }, null, true)
  }

  stop() {
    this.cronJob?.stop()
  }
}

export const notificationsService = new NotificationsService()

export const notifications = async (bot: Bot<MyContext>) => {
  notificationsService.start(bot.api)
}

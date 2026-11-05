import { CronJob } from 'cron'
import type { Bot } from 'grammy'
import { mongoDb } from '../../services/database/mongo.ts'
import { deliverReminders } from '../../services/reminders/delivery.ts'
import type { MyContext } from '../../types/context.ts'
import type { Reminder } from '../../types/db/reminder.ts'

export async function reminders(bot: Bot<MyContext>) {
  const collection = mongoDb.db(process.env.MONGODB_DATABASE_NAME).collection<Reminder>('reminders')
  await collection.createIndex({ nextAt: 1, lockUntil: 1 })
  await collection.createIndex({ snoozeAt: 1, lockUntil: 1 })
  let running = false
  const tick = async () => {
    if (running) return
    running = true
    try {
      await deliverReminders(collection, bot.api)
    }
    catch (error) { console.error('Reminder scheduler failed', error) }
    finally { running = false }
  }
  new CronJob('0 * * * * *', tick, null, true, 'Asia/Yekaterinburg')
  void tick()
}

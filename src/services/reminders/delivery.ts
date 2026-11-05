import { randomBytes } from 'node:crypto'
import { InlineKeyboard, type Api } from 'grammy'
import type { Collection } from 'mongodb'
import type { Reminder } from '../../types/db/reminder.ts'
import { nextDate } from './schedule.ts'

export async function deliverReminders(collection: Collection<Reminder>, api: Pick<Api, 'sendMessage'>, at?: number) {
  // A bounded batch also prevents a persistent Telegram failure from spinning.
  for (let count = 0; count < 100; count++) {
    const now = at ?? Date.now()
    const lockUntil = now + 120_000
    const reminder = await collection.findOneAndUpdate({
      lockUntil: { $lte: now },
      retryAt: { $lte: now },
      $or: [
        { nextAt: { $ne: null, $lte: now } },
        { snoozeAt: { $ne: null, $lte: now } },
      ],
    }, { $set: { lockUntil } }, { returnDocument: 'after', sort: { nextAt: 1 } })
    if (!reminder) return
    const filter = { _id: reminder._id, lockUntil, token: reminder.token }
    const token = randomBytes(6).toString('hex')
    try {
      // grammY types use the older abort-controller interface; Node's signal is compatible at runtime.
      const signal = AbortSignal.timeout(30_000) as unknown as Parameters<Api['sendMessage']>[3]
      await api.sendMessage(reminder.from, `Напоминание: ${reminder.text}`, {
        reply_markup: new InlineKeyboard().text('Завершить', `rm:f:${reminder._id}:${token}`).text('Продолжить', `rm:c:${reminder._id}:${token}`).row().text('Отложить на час', `rm:s:${reminder._id}:${token}`),
      }, signal)
      await collection.updateOne(filter, { $set: {
        nextAt: reminder.nextAt !== null && reminder.nextAt <= now ? nextDate(reminder, now) : reminder.nextAt,
        snoozeAt: reminder.snoozeAt !== null && reminder.snoozeAt <= now ? null : reminder.snoozeAt,
        token,
        lockUntil: 0,
        retryAt: 0,
      } })
    }
    catch (error) {
      await collection.updateOne(filter, { $set: { lockUntil: 0, retryAt: now + 60_000 } })
      console.error('Reminder delivery failed', reminder._id.toString(), error)
    }
  }
}

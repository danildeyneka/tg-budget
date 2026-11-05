import { Bot } from 'grammy'
import type { MyContext } from '../../types/context.ts'
import { menu } from './menu.ts'
import { notifications } from './notifications.ts'
import { reminders } from './reminders.ts'

const middlewares = [menu, notifications, reminders]

export const initMiddleware = async (bot: Bot<MyContext>) => {
  for (const middle of middlewares) {
    await middle(bot)
  }
}

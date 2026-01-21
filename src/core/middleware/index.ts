import { Bot } from 'grammy'
import type { MyContext } from '../../types/context.ts'
import { menu } from './menu.ts'
import { notifications } from './notifications.ts'

const middlewares = [menu, notifications]

export const initMiddleware = async (bot: Bot<MyContext>) => {
  for (const middle of middlewares) {
    await middle(bot)
  }
}

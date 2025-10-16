import { Bot, type Composer } from 'grammy'
import type { MyContext } from '../types/context.ts'

export const loadHandlers = (bot: Bot<MyContext> | Composer<MyContext>, composers: Array<Composer<MyContext>>) => composers
  .forEach(composer => bot.use(composer))

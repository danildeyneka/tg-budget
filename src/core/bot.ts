import 'dotenv/config'

import { Bot } from 'grammy'
import { botHandlers } from '../handlers/index.ts'
import { handleError } from '../helpers/errors.ts'
import { loadHandlers } from '../helpers/load-handlers.ts'
import { initHealthServer } from '../services/server/health-server.ts'
import type { MyContext } from '../types/context.ts'

const bootstrap = async () => {
  const isDev = !!process.env.DEV_MODE

  const bot = new Bot<MyContext>(isDev ? process.env.BOT_API_TOKEN_DEV! : process.env.BOT_API_TOKEN!)

  loadHandlers(
    bot,
    botHandlers,
  )
  bot.catch(err => handleError(err))

  initHealthServer()

  await bot.start()
}

bootstrap()

import 'dotenv/config'

import { Bot } from 'grammy'
import { botHandlers } from '../handlers/index.ts'
import { handleError } from '../helpers/errors.ts'
import { loadHandlers } from '../helpers/load-handlers.ts'
import type { MyContext } from '../types/context.ts'

import '../services/server/health-server.ts'

const bootstrap = async () => {
  const bot = new Bot<MyContext>(process.env.BOT_API_TOKEN!)

  loadHandlers(
    bot,
    botHandlers,
  )
  bot.catch(err => handleError(err))

  await bot.start()
}

bootstrap()

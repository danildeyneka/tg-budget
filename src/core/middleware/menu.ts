import { Bot } from 'grammy'
import { COMMANDS_NAMES } from '../../constants/commands.ts'
import type { MyContext } from '../../types/context.ts'

export const menu = async (bot: Bot<MyContext>) => {
  const commands = Object.entries(COMMANDS_NAMES).map(([command, description]) => ({ command, description }))

  await bot.api.setMyCommands(commands)
  await bot.api.setChatMenuButton({
    menu_button: {
      type: 'commands',
    },
  })
}

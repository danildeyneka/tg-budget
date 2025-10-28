import { Composer } from 'grammy'
import { COMMANDS } from '../../constants/commands.ts'
import type { MyContext } from '../../types/context.ts'

export const categoriesComposer = new Composer<MyContext>()

categoriesComposer.command(
  COMMANDS.CATEGORIES,
  async (ctx) => {
    // add
    // delete
    // edit
    // only admin
    // все связи после операции переименовать если успешно то ренейм, диаграммы тоже обновляются
  },
)

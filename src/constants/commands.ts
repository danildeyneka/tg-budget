export const COMMANDS = {
  START: 'start',
  ADD_EXPENSE: 'add_expense',
  EDIT_EXPENSE: 'edit_expense',
  CATEGORIES: 'categories',
  SHOW_EXPENSES: 'show_expenses',
  LAST_EXPENSES: 'last_expenses',
}

export const COMMANDS_NAMES = {
  [COMMANDS.ADD_EXPENSE]: 'Добавить расход',
  // [COMMANDS.ADD_EXPENSE]: 'Изменить расход',
  // [COMMANDS.CATEGORIES]: 'Управление категориями',
  [COMMANDS.SHOW_EXPENSES]: 'Статистика расходов',
  [COMMANDS.LAST_EXPENSES]: 'Последние расходы',
}

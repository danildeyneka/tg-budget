export const COMMANDS = {
  START: 'start',
  ADD_EXPENSE: 'add_expense',
  EDIT_EXPENSE: 'edit_expense',
  CATEGORIES: 'categories',
  SHOW_EXPENSES: 'show_expenses',
  EXPENSES_GRAPH: 'expenses_graph',
  LAST_EXPENSES: 'last_expenses',
}

export const COMMANDS_NAMES = {
  [COMMANDS.ADD_EXPENSE]: 'Добавить расход',
  [COMMANDS.EDIT_EXPENSE]: 'Редактировать последнюю трату',
  // [COMMANDS.ADD_EXPENSE]: 'Изменить расход',
  // [COMMANDS.CATEGORIES]: 'Управление категориями',
  [COMMANDS.SHOW_EXPENSES]: 'Статистика расходов',
  [COMMANDS.EXPENSES_GRAPH]: 'График расходов',
  [COMMANDS.LAST_EXPENSES]: 'Последние расходы',
}

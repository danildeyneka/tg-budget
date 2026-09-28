import { Keyboard } from 'grammy'
import { ObjectId } from 'mongodb'
import { PARTNER_TYPES_NAMES } from '../../../../constants/partners.ts'
import { valiDate } from '../../../../helpers/date.ts'
import { revertKeyValOfObject } from '../../../../helpers/utils.ts'
import type { MyContext } from '../../../../types/context.ts'
import type { Expense } from '../../../../types/db/expense.ts'
import { EDIT_EXPENSE_FIELDS, EDIT_EXPENSE_STEPS } from './constants.ts'

type EditableExpenseField = keyof typeof EDIT_EXPENSE_FIELDS

export const editExpenseCallbacks = {
  [EDIT_EXPENSE_STEPS.FIELD]: selectField,
  [EDIT_EXPENSE_STEPS.VALUE]: updateField,
}

async function selectField(ctx: MyContext) {
  const selected = ctx.message?.text
  const field = Object.entries(EDIT_EXPENSE_FIELDS)
    .find(([, label]) => label === selected)?.[0] as EditableExpenseField | undefined

  if (!field) {
    await ctx.reply('Выберите поле с клавиатуры')
    return
  }

  ctx.session.editExpenseField = field
  ctx.session.nextStep = EDIT_EXPENSE_STEPS.VALUE

  if (field === 'category') {
    const keyboard = new Keyboard().oneTime().resized()
    ctx.db.categories.forEach((category, index) => {
      keyboard.text(category)
      if (index % 2) keyboard.row()
    })
    await ctx.reply('Выберите новую категорию', { reply_markup: keyboard })
    return
  }

  if (field === 'for') {
    const keyboard = new Keyboard().oneTime().resized()
    Object.values(PARTNER_TYPES_NAMES).forEach(type => keyboard.text(type))
    await ctx.reply('Выберите новый тип траты', { reply_markup: keyboard })
    return
  }

  const prompts: Record<'sum' | 'date' | 'comment', string> = {
    sum: 'Введите новую сумму траты',
    date: 'Введите новую дату в формате dd.mm или dd.mm.yyyy',
    comment: 'Введите новый комментарий',
  }
  await ctx.reply(prompts[field])
}

async function updateField(ctx: MyContext) {
  const field = ctx.session.editExpenseField as EditableExpenseField
  const input = (ctx.message?.text || '').trim()
  let value: string | number = input

  if (field === 'category' && !ctx.db.categories.includes(input)) {
    await ctx.reply('Выберите категорию из существующих')
    return
  }

  if (field === 'for') {
    if (!Object.values(PARTNER_TYPES_NAMES).includes(input)) {
      await ctx.reply('Выберите тип из существующих')
      return
    }
    value = revertKeyValOfObject(PARTNER_TYPES_NAMES)[input]!
  }

  if (field === 'sum') {
    if (!input || !Number.isFinite(Number(input))) {
      await ctx.reply('Введите числовое значение')
      return
    }
    value = Math.round(Number(input))
  }

  if (field === 'date') {
    const date = input.includes('.') && input.split('.')[2]?.length !== 4
      ? `${input}.${new Date().getFullYear()}`
      : input
    if (!valiDate(date)) {
      await ctx.reply('Введите дату в формате dd.mm или dd.mm.yyyy')
      return
    }
    value = date
  }

  if (field === 'comment' && !input) {
    await ctx.reply('Введите комментарий')
    return
  }

  if (!ctx.session.editExpenseId || !Object.hasOwn(EDIT_EXPENSE_FIELDS, field)) {
    ctx.session.nextStep = ''
    await ctx.reply('Не удалось определить трату для редактирования. Запустите команду заново.')
    return
  }

  const update = { [field]: value } as Partial<Expense>
  const result = await ctx.db.expenses.updateOne(
    { _id: new ObjectId(ctx.session.editExpenseId), from: ctx.from!.id },
    { $set: update },
  )

  ctx.session.editExpenseId = ''
  ctx.session.editExpenseField = ''
  ctx.session.nextStep = ''

  await ctx.reply(result.matchedCount ? 'Трата обновлена' : 'Трата не найдена. Запустите команду заново.')
}

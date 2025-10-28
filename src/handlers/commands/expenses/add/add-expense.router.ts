import { Keyboard } from 'grammy'
import {
  ADD_EXPENSE_STEPS,
} from '../../../../constants/expenses/add-expense.ts'
import { PARTNER_TYPES_NAMES } from '../../../../constants/partners.ts'
import { getDates, getLastDate, valiDate } from '../../../../helpers/date.ts'
import { revertKeyValOfObject } from '../../../../helpers/utils.ts'
import type { MyContext } from '../../../../types/context.ts'
import { reactOnSum } from './helpers.ts'

const SKIP = 'Пропустить'
const TODAY = 'Сегодня'
const YESTERDAY = 'Вчера'

export const addExpenseCallbacks = {
  [ADD_EXPENSE_STEPS.CATEGORY]: addCategory,
  [ADD_EXPENSE_STEPS.PARTNER_TYPE]: addPartnerType,
  [ADD_EXPENSE_STEPS.SUM]: addSum,
  [ADD_EXPENSE_STEPS.DATE]: addDate,
  [ADD_EXPENSE_STEPS.COMMENT]: addComment,
}

async function addCategory(ctx: MyContext) {
  const selectedCategory = ctx.message?.text || ''

  if (!ctx.db.categories.includes(selectedCategory)) {
    await ctx.reply('Выберите категорию из существующих')
    return
  }

  ctx.session.expense.category = selectedCategory
  ctx.session.nextStep = ADD_EXPENSE_STEPS.PARTNER_TYPE

  const typeKeyboard = new Keyboard().oneTime()
    .resized()
  Object.values(PARTNER_TYPES_NAMES).forEach(type => typeKeyboard.text(type))

  await ctx.reply(
    'Выберите тип траты',
    {
      reply_markup: typeKeyboard,
    },
  )
}

async function addPartnerType(ctx: MyContext) {
  const selectedType = ctx.message?.text || ''

  if (!Object.values(PARTNER_TYPES_NAMES).includes(selectedType)) {
    await ctx.reply('Выберите тип из существующих')
    return
  }

  ctx.session.expense.for = revertKeyValOfObject(PARTNER_TYPES_NAMES)[selectedType]!
  ctx.session.nextStep = ADD_EXPENSE_STEPS.SUM

  await ctx.reply('Введите сумму траты')
}

async function addSum(ctx: MyContext) {
  const selectedSum = ctx.message?.text || ''

  if (!selectedSum || isNaN(+selectedSum)) {
    await ctx.reply('Введите числовое значение')
    return
  }

  await reactOnSum(
    +selectedSum,
    ctx,
  )

  ctx.session.expense.sum = Math.round(+selectedSum)
  ctx.session.nextStep = ADD_EXPENSE_STEPS.DATE

  const lastDate = ctx.session.expense.date

  const datesKeyboard = new Keyboard().oneTime()
    .resized()
  datesKeyboard.text(TODAY).text(YESTERDAY)
    .row()

  if (lastDate) datesKeyboard.text(getLastDate(lastDate))

  await ctx.reply(
    'Выберите дату или введите вручную (dd.mm.yyyy)',
    {
      reply_markup: datesKeyboard,
    },
  )
}

async function addDate(ctx: MyContext) {
  const date = ctx.message?.text || ''
  const lastDate = ctx.session.expense.date
  const lastDateName = getLastDate(lastDate)

  const isValidString = [
    TODAY,
    YESTERDAY,
    lastDateName,
  ].includes(date)

  if (!valiDate(date) && !isValidString) {
    await ctx.reply('Введите валидную дату')
    return
  }

  const { today, yesterday } = getDates()

  switch (date) {
    case TODAY: {
      ctx.session.expense.date = today
      break
    }
    case YESTERDAY: {
      ctx.session.expense.date = yesterday
      break
    }
    case lastDateName: {
      break
    }
    default: {
      ctx.session.expense.date = date
      break
    }
  }

  ctx.session.nextStep = ADD_EXPENSE_STEPS.COMMENT

  const skip = new Keyboard().oneTime()
    .text(SKIP)
    .resized()

  await ctx.reply(
    'Введите комментарий или пропустите шаг',
    {
      reply_markup: skip,
    },
  )
}

async function addComment(ctx: MyContext) {
  const comment = (ctx.message?.text || '').trim()

  if (comment && comment !== SKIP) ctx.session.expense.comment = comment
  ctx.session.expense.from = ctx.from!.id

  await ctx.db.expenses.insertOne(ctx.session.expense)

  const date = ctx.session.expense.date || ''
  ctx.session.expense = {}
  ctx.session.expense.date = date
  ctx.session.nextStep = ''

  await ctx.reply('Успех! Ваша покупка внесена в расходы')

  const cmdKeyboard = new Keyboard().oneTime()
    .resized()
    .text('/add_expense')
  await ctx.reply(
    'Хотите внести еще один расход?',
    {
      reply_markup: cmdKeyboard,
    },
  )
}

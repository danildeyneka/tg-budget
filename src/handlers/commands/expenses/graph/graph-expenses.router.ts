import { InputFile } from 'grammy'
import { SHOW_EXPENSES_NAMES } from '../total/constants.ts'
import type { MyContext } from '../../../../types/context.ts'
import { renderCategoryExpensePieChart } from './chart.ts'
import { GRAPH_EXPENSES_STEPS } from './constants.ts'
import { buildCategoryExpenseChartData } from './helpers.ts'

export const graphExpensesCallbacks = {
  [GRAPH_EXPENSES_STEPS.PERIOD]: selectPeriod,
}

async function selectPeriod(ctx: MyContext) {
  const period = ctx.message?.text || ''

  if (!Object.values(SHOW_EXPENSES_NAMES).includes(period)) {
    await ctx.reply('Выберите период из списка')
    return
  }

  const chartData = buildCategoryExpenseChartData(
    ctx.session.totalExpenses,
    period,
  )

  ctx.session.nextStep = ''

  if (chartData.length === 0) {
    await ctx.reply('За выбранный период расходов нет')
    return
  }

  const image = await renderCategoryExpensePieChart(
    chartData,
    period,
  )

  await ctx.replyWithPhoto(
    new InputFile(
      image,
      'expenses-graph.png',
    ),
    {
      caption: `График расходов за период: ${period}`,
    },
  )
}

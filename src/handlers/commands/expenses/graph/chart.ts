import type { ChartConfiguration } from 'chart.js'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import { RUBLE } from '../../../../constants/common.ts'
import type { CategoryExpenseChartRow } from './helpers.ts'

const WIDTH = 900
const HEIGHT = 600

const chartRenderer = new ChartJSNodeCanvas({
  width: WIDTH,
  height: HEIGHT,
  backgroundColour: 'white',
})

const COLORS = [
  '#4E79A7',
  '#F28E2B',
  '#E15759',
  '#76B7B2',
  '#59A14F',
  '#EDC948',
  '#B07AA1',
  '#FF9DA7',
  '#9C755F',
  '#BAB0AC',
]

export const renderCategoryExpensePieChart = async (
  data: CategoryExpenseChartRow[],
  period: string,
) => {
  const total = data.reduce(
    (sum, row) => sum + row.sum,
    0,
  )

  const config: ChartConfiguration<'pie'> = {
    type: 'pie',
    data: {
      labels: data.map(row => `${row.category}: ${row.sum}${RUBLE}`),
      datasets: [
        {
          data: data.map(row => row.sum),
          backgroundColor: data.map((_, index) => COLORS[index % COLORS.length]),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: `Расходы по категориям - ${period}. Всего: ${total}${RUBLE}`,
          color: '#222222',
          font: {
            size: 24,
            weight: 'bold',
          },
          padding: {
            bottom: 24,
          },
        },
        legend: {
          position: 'right',
          labels: {
            color: '#222222',
            font: {
              size: 16,
            },
            padding: 18,
          },
        },
      },
    },
  }

  return chartRenderer.renderToBuffer(config)
}

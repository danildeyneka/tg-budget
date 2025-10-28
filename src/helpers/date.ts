const DAY_IN_MS = 24 * 60 * 60 * 1000

export const dateFormatter = (date = new Date()) => new Intl.DateTimeFormat(
  'ru-RU',
  {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
).format(date)
  .replaceAll(
    '/',
    '.',
  )

export const getDates = () => {
  const today = dateFormatter()

  const yesterday = dateFormatter(new Date(Date.now() - DAY_IN_MS))

  return { today,
    yesterday }
}

export const getLastDate = (lastDate?: string) => `Прошлая выбранная дата - ${lastDate}`

export const valiDate = (date: string) => (/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.\d{4}$/).test(date)

export const parseDate = (date: string, separator = '.') => {
  const [day, month, year] = date.split(separator).map(Number)
  return new Date(year!, month! - 1, day).getTime()
}

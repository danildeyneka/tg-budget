import type { Reminder } from '../../types/db/reminder.ts'

const DAY = 86_400_000

export function relativeDate(term: string, now = Date.now()): string | null {
  const local = new Date(now + 5 * 3_600_000)
  const year = local.getUTCFullYear()
  const month = local.getUTCMonth()
  const day = local.getUTCDate()
  let target: Date
  if (term === 'Через 2 недели') target = new Date(Date.UTC(year, month, day + 14))
  else if (term === 'Через месяц' || term === 'Через 3 месяца') {
    const nextMonth = month + (term === 'Через месяц' ? 1 : 3)
    const last = new Date(Date.UTC(year, nextMonth + 1, 0)).getUTCDate()
    target = new Date(Date.UTC(year, nextMonth, Math.min(day, last)))
  }
  else return null
  return `${String(target.getUTCDate()).padStart(2, '0')}.${String(target.getUTCMonth() + 1).padStart(2, '0')}.${target.getUTCFullYear()}`
}

export function firstDate(date: string): number {
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(date)) return NaN
  const [day, month, year] = date.split('.').map(Number) as [number, number, number]
  const timestamp = Date.UTC(year, month - 1, day, 10)
  const parsed = new Date(timestamp)
  return parsed.getUTCDate() === day && parsed.getUTCMonth() === month - 1 && parsed.getUTCFullYear() === year
    ? timestamp
    : NaN
}

export function nextDate(reminder: Pick<Reminder, 'date' | 'repeat'>, now: number): number | null {
  const start = firstDate(reminder.date)
  if (!Number.isFinite(start)) throw new Error('Invalid reminder date')
  if (start > now) return start
  if (reminder.repeat === 'once') return null
  if (reminder.repeat === 'fortnightly') return start + (Math.floor((now - start) / (14 * DAY)) + 1) * 14 * DAY
  const original = new Date(start)
  const current = new Date(now)
  let month = current.getUTCMonth()
  const year = current.getUTCFullYear()
  const atMonth = (offset: number) => {
    const lastDay = new Date(Date.UTC(year, offset + 1, 0)).getUTCDate()
    return Date.UTC(year, offset, Math.min(original.getUTCDate(), lastDay), 10)
  }
  if (atMonth(month) <= now) month++
  return atMonth(month)
}

export type Reminder = {
  from: number
  text: string
  date: string
  repeat: 'once' | 'monthly' | 'fortnightly'
  createdAt: number
  nextAt: number | null
  snoozeAt: number | null
  token: string
  lockUntil: number
  retryAt: number
  category?: string
  completedAt?: number | null
  expenseId?: string
  expenseDecision?: 'pending' | 'yes' | 'no' | 'recorded'
}

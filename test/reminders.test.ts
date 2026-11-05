import assert from 'node:assert/strict'
import test from 'node:test'
import { Context, type Api } from 'grammy'
import { ObjectId, type Collection, type WithId } from 'mongodb'
import { firstDate, nextDate, relativeDate } from '../src/services/reminders/schedule.ts'
import { reminderExpenseCallbacks } from '../src/handlers/commands/reminders/reminder-expense.router.ts'
import { deliverReminders } from '../src/services/reminders/delivery.ts'
import { remindersComposer } from '../src/handlers/commands/reminders/reminders.ts'
import { reminderCallbacks } from '../src/handlers/commands/reminders/reminders.router.ts'
import { REMINDER_STEPS } from '../src/handlers/commands/reminders/constants.ts'
import type { Reminder } from '../src/types/db/reminder.ts'
import type { MyContext } from '../src/types/context.ts'

const now = firstDate('04.11.2026')
function record(overrides: Partial<Reminder> = {}): WithId<Reminder> {
  return { _id: new ObjectId(), from: 1, text: 'Оплатить', date: '04.11.2026', repeat: 'once', createdAt: now - 1000, nextAt: now, snoozeAt: null, token: 'initial', lockUntil: 0, retryAt: 0, ...overrides }
}

// Test storage interprets only the Mongo operators used by this feature.
function storage(initial: Array<WithId<Reminder>> = []) {
  const rows = initial
  const matches = (row: WithId<Reminder>, query: Record<string, unknown>): boolean => Object.entries(query).every(([key, value]) => {
    if (key === '$or') return (value as Array<Record<string, unknown>>).some(part => matches(row, part))
    const actual = (row as unknown as Record<string, unknown>)[key]
    if (value instanceof ObjectId) return String(actual) === String(value)
    if (value && typeof value === 'object') return Object.entries(value).every(([operator, limit]) => {
      if (operator === '$ne') return actual !== limit
      if (operator === '$lte') return actual !== null && Number(actual) <= Number(limit)
      return false
    })
    return actual === value
  })
  const db = {
    async findOne(query: Record<string, unknown>) { return rows.find(row => matches(row, query)) ?? null },
    async insertOne(value: Reminder) { rows.push({ ...value, _id: new ObjectId() }) },
    async updateOne(query: Record<string, unknown>, update: { $set: Partial<Reminder> }) {
      const row = rows.find(row => matches(row, query))
      if (row) Object.assign(row, update.$set)
      return { matchedCount: row ? 1 : 0 }
    },
    async deleteOne(query: Record<string, unknown>) {
      const index = rows.findIndex(row => matches(row, query))
      if (index >= 0) rows.splice(index, 1)
      return { deletedCount: index >= 0 ? 1 : 0 }
    },
    async findOneAndUpdate(query: Record<string, unknown>, update: { $set: Partial<Reminder> }) {
      const row = rows.find(row => matches(row, query))
      if (!row) return null
      Object.assign(row, update.$set)
      return { ...row }
    },
  }
  return { rows, collection: db as unknown as Collection<Reminder> }
}

test('dates are real calendar dates at 15:00 UTC+5', () => {
  assert.equal(new Date(now).toISOString(), '2026-11-04T10:00:00.000Z')
  for (const invalid of ['31.02.2026', '29.02.2025', '00.12.2026', '1.11.2026', 'text']) assert.ok(Number.isNaN(firstDate(invalid)))
  assert.ok(Number.isFinite(firstDate('29.02.2028')))
})

test('monthly recurrence restores day 31 and respects leap years', () => {
  const reminder = { date: '31.01.2028', repeat: 'monthly' as const }
  assert.equal(nextDate(reminder, firstDate('31.01.2028')), firstDate('29.02.2028'))
  assert.equal(nextDate(reminder, firstDate('29.02.2028')), firstDate('31.03.2028'))
  assert.equal(nextDate(reminder, firstDate('31.12.2028')), firstDate('31.01.2029'))
})

test('fortnight recurrence skips missed occurrences without drifting', () => {
  assert.equal(nextDate({ date: '04.11.2026', repeat: 'fortnightly' }, firstDate('03.12.2026')), firstDate('16.12.2026'))
  assert.equal(nextDate({ date: '04.11.2026', repeat: 'once' }, now), null)
})

test('delivery completes once and advances repeating schedule', async () => {
  const db = storage([record(), record({ repeat: 'fortnightly' })])
  const sent: unknown[] = []
  const api = { sendMessage: async (...args: unknown[]) => {
    sent.push(args)
  } } as unknown as Api
  await deliverReminders(db.collection, api, now)
  await deliverReminders(db.collection, api, now)
  assert.equal(sent.length, 2)
  assert.equal(db.rows[0]!.nextAt, null)
  assert.equal(db.rows[1]!.nextAt, firstDate('18.11.2026'))
})

test('failed delivery retries later and expired lock recovers', async () => {
  const db = storage([record({ lockUntil: now - 1 })])
  await deliverReminders(db.collection, { sendMessage: async () => {
    throw new Error('offline')
  } } as unknown as Api, now)
  assert.equal(db.rows[0]!.nextAt, now)
  assert.equal(db.rows[0]!.retryAt, now + 60_000)
  let sent = 0
  const api = { sendMessage: async () => {
    sent++
  } } as unknown as Api
  await deliverReminders(db.collection, api, now + 1)
  assert.equal(sent, 0)
  await deliverReminders(db.collection, api, now + 60_000)
  assert.equal(sent, 1)
})

function context(db: Collection<Reminder>, data = '', from = 1) {
  const replies: string[] = []
  const api = {
    answerCallbackQuery: async (_id: string, options: { text?: string }) => { replies.push(options?.text || '') },
    sendMessage: async (_id: number, text: string) => { replies.push(text) },
  } as unknown as Api
  const ctx = new Context({ update_id: 1, callback_query: { id: 'cb', chat_instance: 'chat', data, from: { id: from, is_bot: false, first_name: 'Test' }, message: { message_id: 1, date: 0, chat: { id: from, type: 'private', first_name: 'Test' } } } }, api, { id: 99, is_bot: true, first_name: 'Bot', username: 'test_bot', can_join_groups: false, can_read_all_group_messages: false, supports_inline_queries: false, can_connect_to_business: false, has_main_web_app: false }) as MyContext
  ctx.db = { reminders: db, categories: ['Продукты', 'Дом'] } as MyContext['db']
  ctx.session = { expense: {}, totalExpenses: [], editExpenseId: '', editExpenseField: '', nextStep: '' }
  return { ctx, replies }
}

test('snooze is owner-only, single-use and preserves base schedule', async () => {
  const row = record({ nextAt: firstDate('18.11.2026') })
  const db = storage([row])
  const data = `rm:s:${row._id}:initial`
  await remindersComposer.middleware()(context(db.collection, data, 2).ctx, async () => {})
  assert.equal(row.snoozeAt, null)
  const before = Date.now()
  await remindersComposer.middleware()(context(db.collection, data).ctx, async () => {})
  assert.ok(row.snoozeAt! >= before + 3_600_000)
  const snooze = row.snoozeAt
  await remindersComposer.middleware()(context(db.collection, data).ctx, async () => {})
  assert.equal(row.snoozeAt, snooze)
  assert.equal(row.nextAt, firstDate('18.11.2026'))
})

test('delete rejects foreign and stale buttons', async () => {
  const row = record()
  const db = storage([row])
  for (const [from, token] of [[2, 'initial'], [1, 'stale']] as const) {
    await remindersComposer.middleware()(context(db.collection, `rm:x:${row._id}:${token}`, from).ctx, async () => {})
    assert.equal(db.rows.length, 1)
  }
  await remindersComposer.middleware()(context(db.collection, `rm:x:${row._id}:initial`).ctx, async () => {})
  assert.equal(db.rows.length, 0)
})

test('date input creates reminder and refuses foreign edits or invalid dates', async () => {
  const db = storage()
  const { ctx } = context(db.collection)
  ctx.session.reminderDraft = { text: 'Test', repeat: 'monthly' }
  const input = async (text: string) => {
    ctx.update.message = { message_id: 2, date: 0, from: { id: 1, is_bot: false, first_name: 'Test' }, chat: { id: 1, type: 'private', first_name: 'Test' }, text }
    await reminderCallbacks[REMINDER_STEPS.DATE]!(ctx)
  }
  await input('31.02.2090')
  assert.equal(db.rows.length, 0)
  await input('31.01.2090')
  ctx.update.message!.text = 'Дом'
  await reminderCallbacks[REMINDER_STEPS.CATEGORY]!(ctx)
  assert.equal(db.rows.length, 1)
  const row = db.rows[0]!
  row.from = 2
  ctx.session.reminderDraft = { id: String(row._id), text: 'Changed', repeat: 'once' }
  await input('01.02.2090')
  ctx.update.message!.text = 'Дом'
  await reminderCallbacks[REMINDER_STEPS.CATEGORY]!(ctx)
  assert.equal(row.text, 'Test')
  row.from = 1
  await input('01.02.2090')
  ctx.update.message!.text = 'Дом'
  await reminderCallbacks[REMINDER_STEPS.CATEGORY]!(ctx)
  assert.equal(row.text, 'Changed')
  assert.equal(row.repeat, 'once')
  assert.equal(row.nextAt, firstDate('01.02.2090'))
  assert.notEqual(row.token, 'initial')
})

test('snoozed delivery does not shift the next regular occurrence', async () => {
  const next = firstDate('18.11.2026')
  const row = record({ repeat: 'fortnightly', nextAt: next, snoozeAt: now })
  const db = storage([row])
  let sent = 0
  await deliverReminders(db.collection, { sendMessage: async () => {
    sent++
  } } as unknown as Api, now)
  assert.equal(sent, 1)
  assert.equal(row.nextAt, next)
  assert.equal(row.snoozeAt, null)
})

test('active lease prevents concurrent delivery and deletion', async () => {
  const row = record({ lockUntil: Date.now() + 60_000 })
  const db = storage([row])
  let sent = 0
  await deliverReminders(db.collection, { sendMessage: async () => {
    sent++
  } } as unknown as Api, Date.now())
  await remindersComposer.middleware()(context(db.collection, `rm:x:${row._id}:initial`).ctx, async () => {})
  assert.equal(sent, 0)
  assert.equal(db.rows.length, 1)
})

test('text and recurrence inputs validate and advance the existing router', async () => {
  const { ctx } = context(storage().collection)
  const message = { message_id: 2, date: 0, from: { id: 1, is_bot: false, first_name: 'Test' }, chat: { id: 1, type: 'private' as const, first_name: 'Test' }, text: '' }
  ctx.update.message = message
  ctx.session.nextStep = REMINDER_STEPS.TEXT
  await reminderCallbacks[REMINDER_STEPS.TEXT]!(ctx)
  assert.equal(ctx.session.nextStep, REMINDER_STEPS.TEXT)
  message.text = 'Напомнить о платеже'
  await reminderCallbacks[REMINDER_STEPS.TEXT]!(ctx)
  assert.equal(ctx.session.nextStep, REMINDER_STEPS.REPEAT)
  message.text = 'invalid'
  await reminderCallbacks[REMINDER_STEPS.REPEAT]!(ctx)
  assert.equal(ctx.session.nextStep, REMINDER_STEPS.REPEAT)
  message.text = 'Раз в 2 недели'
  await reminderCallbacks[REMINDER_STEPS.REPEAT]!(ctx)
  assert.equal(ctx.session.reminderDraft?.repeat, 'fortnightly')
  assert.equal(ctx.session.nextStep, REMINDER_STEPS.TERM)
})

test('relative terms use UTC+5 and clamp calendar months', () => {
  assert.equal(relativeDate('Через месяц', Date.parse('2027-01-30T20:00:00Z')), '28.02.2027')
  assert.equal(relativeDate('Через 3 месяца', Date.parse('2026-11-30T10:00:00Z')), '28.02.2027')
  assert.equal(relativeDate('Через 2 недели', Date.parse('2026-12-31T20:00:00Z')), '15.01.2027')
  assert.equal(relativeDate('bad'), null)
})

test('finish stops repeats, rejects old buttons and offers expense only to owner', async () => {
  const row = record({ repeat: 'monthly', category: 'Дом' })
  const db = storage([row])
  await remindersComposer.middleware()(context(db.collection, `rm:f:${row._id}:initial`, 2).ctx, async () => {})
  assert.equal(row.completedAt, undefined)
  await remindersComposer.middleware()(context(db.collection, `rm:f:${row._id}:initial`).ctx, async () => {})
  assert.ok(row.completedAt)
  assert.equal(row.nextAt, null)
  assert.equal(row.snoozeAt, null)
  const expenseId = row.expenseId
  await remindersComposer.middleware()(context(db.collection, `rm:f:${row._id}:initial`).ctx, async () => {})
  assert.equal(row.expenseId, expenseId)
  await remindersComposer.middleware()(context(db.collection, `rm:n:${row._id}:${row.token}`).ctx, async () => {})
  assert.equal(row.expenseDecision, 'no')
})

test('continue keeps recurring anchor and asks a new term for once', async () => {
  const row = record({ repeat: 'monthly' })
  const db = storage([row])
  await remindersComposer.middleware()(context(db.collection, `rm:c:${row._id}:initial`).ctx, async () => {})
  assert.equal(row.date, '04.11.2026')
  assert.equal(row.nextAt, nextDate(row, Date.now()))
  const once = record()
  const other = storage([once])
  const { ctx } = context(other.collection, `rm:c:${once._id}:initial`)
  await remindersComposer.middleware()(ctx, async () => {})
  assert.equal(ctx.session.nextStep, REMINDER_STEPS.TERM)
  assert.equal(ctx.session.reminderDraft?.id, String(once._id))
})

test('expense captures category and completion day, rejects bad sums and retries without duplication', async () => {
  const row = record({ category: 'Дом', completedAt: Date.parse('2026-11-05T20:00:00Z'), expenseDecision: 'pending', expenseId: new ObjectId().toHexString(), nextAt: null })
  const db = storage([row])
  const { ctx } = context(db.collection, `rm:y:${row._id}:initial`)
  await remindersComposer.middleware()(ctx, async () => {})
  assert.equal(ctx.session.reminderExpense?.category, 'Дом')
  await remindersComposer.middleware()(context(db.collection, `rm:n:${row._id}:initial`).ctx, async () => {})
  assert.equal(row.expenseDecision, 'yes')
  const message = { message_id: 2, date: 0, from: { id: 1, is_bot: false, first_name: 'Test' }, chat: { id: 1, type: 'private' as const, first_name: 'Test' }, text: '-10' }
  ctx.update.message = message
  await reminderExpenseCallbacks[REMINDER_STEPS.SUM]!(ctx)
  assert.equal(ctx.session.nextStep, REMINDER_STEPS.SUM)
  message.text = '1200'
  await reminderExpenseCallbacks[REMINDER_STEPS.SUM]!(ctx)
  const saved = new Map<string, Record<string, unknown>>()
  ctx.db.expenses = { updateOne: async (filter: { _id: ObjectId }, update: { $setOnInsert: Record<string, unknown> }) => {
    if (!saved.has(String(filter._id))) saved.set(String(filter._id), update.$setOnInsert)
  } } as unknown as MyContext['db']['expenses']
  message.text = 'На себя'
  await reminderExpenseCallbacks[REMINDER_STEPS.TYPE]!(ctx)
  assert.equal(saved.size, 1)
  assert.equal([...saved.values()][0]!.date, '06.11.2026')
  assert.equal([...saved.values()][0]!.category, 'Дом')
  assert.equal([...saved.values()][0]!.sum, 1200)
  assert.equal(row.expenseDecision, 'recorded')
  row.expenseDecision = 'yes'
  ctx.session.reminderExpense = { id: String(row._id), expenseId: row.expenseId!, category: 'Дом', sum: 1200 }
  await reminderExpenseCallbacks[REMINDER_STEPS.TYPE]!(ctx)
  assert.equal(saved.size, 1)
  row.expenseDecision = 'yes'
  ctx.session.reminderExpense = { id: String(row._id), expenseId: 'outdated', category: 'Дом', sum: 1200 }
  await reminderExpenseCallbacks[REMINDER_STEPS.TYPE]!(ctx)
  assert.equal(saved.size, 1)
  assert.equal(row.expenseDecision, 'yes')
})

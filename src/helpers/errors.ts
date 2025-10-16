import { BotError, GrammyError, HttpError } from 'grammy'
import { MongoServerError } from 'mongodb'
import type { MyContext } from '../types/context.ts'

export const handleError = (err: BotError<MyContext>) => {
  const ctx = err.ctx
  const e = err.error
  console.error(`Error while handling update ${ctx.update.update_id}:`)

  if (e instanceof GrammyError) {
    console.error(
      'Error in request:',
      e.description,
    )
  }
  else if (e instanceof HttpError) {
    console.error(
      'Could not contact Telegram:',
      e,
    )
  }
  else if (e instanceof MongoServerError) {
    if (e.code === 121) {
      console.error(
        'Schema is not valid',
        JSON.stringify(
          e.errInfo?.details.schemaRulesNotSatisfied,
          null,
          2,
        ),
      )
    }
    else console.error(
      'MongoDb Error:',
      e,
    )
  }
  else {
    console.error(
      'Unknown error:',
      e,
    )
  }
}

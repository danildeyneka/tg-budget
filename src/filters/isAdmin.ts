import type { MyContext } from '../types/context.ts'

export const isAdmin = (ctx: MyContext) => {
  const admin = process.env.ADMIN_ID
  return Boolean(ctx.from?.id && ctx.from.id + '' === admin)
}

import type { MyContext } from '../../types/context.ts'

export type RouterStep = (ctx: MyContext) => Promise<void>

export class Router {
  private handlers = new Map<string, RouterStep>()

  register(step: string, handler: RouterStep) {
    this.handlers.set(
      step,
      handler,
    )
  }

  async process(ctx: MyContext) {
    const handler = this.handlers.get(ctx.session.nextStep)
    if (!handler) return false

    await handler(ctx)
    return true
  }
}

export const router = new Router()

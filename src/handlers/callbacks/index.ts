import { Composer } from 'grammy'
import { router, type RouterStep } from '../../core/middleware/router.ts'
import type { MyContext } from '../../types/context.ts'

export const routerComposer = new Composer<MyContext>()

routerComposer.on(
  'message:text',
  async (ctx, next) => {
    if (ctx.message?.text?.startsWith('/')) return await next()

    const wasHandled = await router.process(ctx)

    if (wasHandled) await next()

    if (!wasHandled) await ctx.reply('Неизвестная команда! Используйте меню бота')
  },
)

export const loadCallbacks = (callbacks: Record<string, RouterStep>) => Object.entries(callbacks).forEach(([
  step,
  cb,
]) => {
  router.register(
    step,
    cb,
  )
})

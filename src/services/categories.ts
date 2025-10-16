import { Composer } from 'grammy'
import type { MyContext } from '../types/context.ts'
import type { Categories } from '../types/db/categories.ts'

class CategoriesService {
  private cachedCategories: Categories = []

  async revalidate(ctx: MyContext) {
    const categories = await ctx.db.categoriesWorker.find().next()
    this.cachedCategories = categories?.data || []
    return this.cachedCategories
  }

  async get(ctx: MyContext) {
    if (!this.cachedCategories.length) {
      await this.revalidate(ctx)
    }
    return this.cachedCategories
  }
}

export const categoriesService = new CategoriesService()

export const categoriesServiceComposer = new Composer<MyContext>()

categoriesServiceComposer.use(async (ctx, next) => {
  ctx.db.categories = await categoriesService.get(ctx)

  await next()
})

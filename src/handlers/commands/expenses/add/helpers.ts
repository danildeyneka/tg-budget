import type { MyContext } from '../../../../types/context.ts'

export const reactOnSum = async (sum: number, ctx: MyContext) => {
  if (sum === 0) {
    await ctx.react('🎃')
  }
  else if (sum < 100) {
    await ctx.react('🥱')
  }
  else if (sum < 500) {
    await ctx.react('🤔')
  }
  else if (sum < 1000) {
    await ctx.react('⚡')
  }
  else if (sum < 2000) {
    await ctx.react('👻')
  }
  else if (sum < 3000) {
    await ctx.react('👀')
  }
  else if (sum < 5000) {
    await ctx.react('🌚')
  }
  else if (sum < 7000) {
    await ctx.react('😢')
  }
  else if (sum < 10_000) {
    await ctx.react('🤯')
  }
  else if (sum < 20_000) {
    await ctx.react('🗿')
  }
  else if (sum < 30_000) {
    await ctx.react('🫡')
  }
  else if (sum < 50_000) {
    await ctx.react('☃')
  }
  else if (sum < 70_000) {
    await ctx.react('😨')
  }
  else if (sum < 100_000) {
    await ctx.react('😡')
  }
  else if (sum < 150_000) {
    await ctx.react('🤬')
  }
  else if (sum > 150_000) {
    await ctx.react('🤡')
  }
}

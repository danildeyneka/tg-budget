export function revertKeyValOfObject<K extends string, V extends string>(obj: Record<K, V>): Record<V, K> {
  return Object.fromEntries(Object.entries(obj).map(([
    k,
    v,
  ]) => [
    v,
    k,
  ]))
}

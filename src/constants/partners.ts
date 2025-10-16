export const PARTNER_TYPES = {
  MYSELF: 'myself',
  PARTNER: 'partner',
  TOGETHER: 'together',
}

export const PARTNER_TYPES_NAMES = {
  [PARTNER_TYPES.MYSELF]: 'На себя',
  [PARTNER_TYPES.PARTNER]: 'На партнера',
  [PARTNER_TYPES.TOGETHER]: 'На нас',
}

export const PARTNER_TYPES_NAMES_REVERSED = Object.fromEntries(Object.entries(PARTNER_TYPES_NAMES).map(([
  k,
  v,
]) => [
  v,
  k,
]))

export const shouldIgnore = (payload) =>
  [3, 5, 7, 12, 13, 14].includes(payload.game_type) ||
  payload.version_parent !== null;

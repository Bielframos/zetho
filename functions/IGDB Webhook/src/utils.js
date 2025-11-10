export const shouldIgnore = (payload) => {
  const GAME_TYPES_TO_IGNORE = [3, 5, 7, 12, 13, 14];

  if (GAME_TYPES_TO_IGNORE.includes(payload.game_type)) return true;
  else if (payload.version_parent !== null) return true;
};

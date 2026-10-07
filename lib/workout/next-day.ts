/**
 * The day to highlight on the training screen: the one after the day of the
 * last completed session, wrapping to the first. Every day stays startable.
 */
export function suggestNextDayId(
  orderedDayIds: string[],
  lastCompletedDayId: string | null,
): string | null {
  if (orderedDayIds.length === 0) return null;
  const last = lastCompletedDayId == null ? -1 : orderedDayIds.indexOf(lastCompletedDayId);
  return orderedDayIds[(last + 1) % orderedDayIds.length];
}

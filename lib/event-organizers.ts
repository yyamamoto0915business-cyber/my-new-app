/** イベント→主催者IDのマッピング（モック） */

export const EVENT_ORGANIZER_MAP: Record<string, string> = {
  "1": "o1",
  "2": "o2",
  "3": "o3",
  "4": "o4",
  "5": "o5",
  "6": "o6",
};

export function getOrganizerIdByEventId(eventId: string): string | null {
  return EVENT_ORGANIZER_MAP[eventId] ?? null;
}

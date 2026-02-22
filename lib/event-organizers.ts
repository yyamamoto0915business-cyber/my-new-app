/** イベント→主催者IDのマッピング（モック） */

const EVENT_ORGANIZER_MAP: Record<string, string> = {
  "1": "o1",
  "2": "o2",
  "3": "o3",
  "4": "o4",
  "5": "o5",
  "6": "o6",
};

/** 主催者が作成したイベントのマッピング（動的追加） */
const createdEventOrganizers = new Set<string>();

export function setOrganizerForCreatedEvent(eventId: string): void {
  createdEventOrganizers.add(eventId);
}

export function getOrganizerIdByEventId(eventId: string): string | null {
  if (EVENT_ORGANIZER_MAP[eventId]) return EVENT_ORGANIZER_MAP[eventId];
  if (createdEventOrganizers.has(eventId)) return "o-created";
  return null;
}

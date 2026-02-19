/** Application / Thread / Message モック（ボランティア応募→主催者DM） */

export type ApplicationStatus = "APPLIED" | "CONFIRMED" | "REJECTED";

export type ThreadStatus = "open" | "resolved";

export type Application = {
  id: string;
  volunteerRoleId: string;
  volunteerId: string;
  status: ApplicationStatus;
  threadId: string;
  createdAt: string;
};

export type Thread = {
  id: string;
  type: "VOLUNTEER_DM";
  eventId: string;
  volunteerRoleId: string;
  organizerId: string;
  volunteerId: string;
  status: ThreadStatus;
  lastMessageAt: string;
  createdAt: string;
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

const applications = new Map<string, Application>();
const threads = new Map<string, Thread>();
const messages = new Map<string, Message[]>();

function uuid() {
  return `dm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const INITIAL_MESSAGE = "このボランティアに応募しました。よろしくお願いします。";

export function createApplicationAndThread(
  volunteerRoleId: string,
  volunteerId: string,
  organizerId: string,
  eventId: string
): { application: Application; thread: Thread } | null {
  const existing = Array.from(threads.values()).find(
    (t) =>
      t.volunteerRoleId === volunteerRoleId &&
      t.volunteerId === volunteerId &&
      t.organizerId === organizerId
  );
  if (existing) {
    const app = Array.from(applications.values()).find(
      (a) => a.threadId === existing.id
    );
    return app ? { application: app, thread: existing } : null;
  }

  const threadId = uuid();
  const now = new Date().toISOString();

  const thread: Thread = {
    id: threadId,
    type: "VOLUNTEER_DM",
    eventId,
    volunteerRoleId,
    organizerId,
    volunteerId,
    status: "open",
    lastMessageAt: now,
    createdAt: now,
  };
  threads.set(threadId, thread);

  const appId = uuid();
  const application: Application = {
    id: appId,
    volunteerRoleId,
    volunteerId,
    status: "APPLIED",
    threadId,
    createdAt: now,
  };
  applications.set(appId, application);

  const msg: Message = {
    id: uuid(),
    threadId,
    senderId: volunteerId,
    body: INITIAL_MESSAGE,
    createdAt: now,
    readAt: null,
  };
  const list = messages.get(threadId) ?? [];
  list.push(msg);
  messages.set(threadId, list);

  return { application, thread };
}

export function getThreadById(id: string): Thread | undefined {
  return threads.get(id);
}

export function getThreadsForOrganizer(organizerId: string): Thread[] {
  return Array.from(threads.values())
    .filter((t) => t.organizerId === organizerId)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

export function getThreadsForVolunteer(volunteerId: string): Thread[] {
  return Array.from(threads.values())
    .filter((t) => t.volunteerId === volunteerId)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

export function canAccessThread(thread: Thread, userId: string): boolean {
  return thread.organizerId === userId || thread.volunteerId === userId;
}

export function getMessages(threadId: string): Message[] {
  const list = messages.get(threadId) ?? [];
  return [...list].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function addMessage(
  threadId: string,
  senderId: string,
  body: string
): Message | null {
  const thread = threads.get(threadId);
  if (!thread) return null;
  const now = new Date().toISOString();
  const msg: Message = {
    id: uuid(),
    threadId,
    senderId,
    body: body.trim(),
    createdAt: now,
    readAt: null,
  };
  const list = messages.get(threadId) ?? [];
  list.push(msg);
  messages.set(threadId, list);
  thread.lastMessageAt = now;
  return msg;
}

export function setThreadStatus(threadId: string, status: "open" | "resolved"): boolean {
  const thread = threads.get(threadId);
  if (!thread) return false;
  thread.status = status;
  return true;
}

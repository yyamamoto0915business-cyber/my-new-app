/** ユーザーとroleのインメモリストア（MVP用・将来DBに移行） */

export type UserRole = "ATTENDEE" | "VOLUNTEER" | "ORGANIZER" | null;

type StoredUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
};

const users = new Map<string, StoredUser>();

function uuid() {
  return `u-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateUser(email: string, name: string, id?: string): StoredUser {
  const existing = Array.from(users.values()).find((u) => u.email === email);
  if (existing) return existing;
  const finalId = id ?? uuid();
  const user: StoredUser = {
    id: finalId,
    email,
    name,
    role: null,
    createdAt: new Date().toISOString(),
  };
  users.set(finalId, user);
  users.set(email.toLowerCase(), user);
  return user;
}

export function getUserById(id: string): StoredUser | undefined {
  return users.get(id);
}

export function getUserByEmail(email: string): StoredUser | undefined {
  return users.get(email.toLowerCase());
}

export function getUserRole(idOrEmail: string): UserRole {
  const u = users.get(idOrEmail) ?? users.get(idOrEmail.toLowerCase());
  return u?.role ?? null;
}

export function setUserRole(idOrEmail: string, role: UserRole): void {
  const u = users.get(idOrEmail) ?? users.get(idOrEmail.toLowerCase());
  if (u) u.role = role;
}

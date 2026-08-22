const privateByUserId = new Map<string, boolean>();

export function getMemoryIsPrivate(userId: string): boolean {
  return privateByUserId.get(userId) ?? false;
}

export function setMemoryIsPrivate(userId: string, isPrivate: boolean): void {
  privateByUserId.set(userId, isPrivate);
}

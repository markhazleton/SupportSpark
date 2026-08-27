import type { User, InsertUser, Conversation, Message, Supporter } from "@shared/schema";
import { DEMO_SUPPORTER_ID } from "./seed-data";

// localStorage key constants
const KEYS = {
  users: "supportSpark_users",
  conversations: "supportSpark_conversations",
  supporters: "supportSpark_supporters",
  session: "supportSpark_session",
  initialized: "supportSpark_initialized",
  nextConversationId: "supportSpark_nextConversationId",
  nextSupporterId: "supportSpark_nextSupporterId",
} as const;

// === Helpers ===

function getItem<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return JSON.parse(raw) as T;
}

function setItem(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers(): User[] {
  return getItem<User[]>(KEYS.users, []);
}

function setUsers(users: User[]): void {
  setItem(KEYS.users, users);
}

function getConversationsStore(): Conversation[] {
  return getItem<Conversation[]>(KEYS.conversations, []);
}

function setConversationsStore(conversations: Conversation[]): void {
  setItem(KEYS.conversations, conversations);
}

function getSupportersStore(): Supporter[] {
  return getItem<Supporter[]>(KEYS.supporters, []);
}

function setSupportersStore(supporters: Supporter[]): void {
  setItem(KEYS.supporters, supporters);
}

function getSessionUserId(): string | null {
  return getItem<string | null>(KEYS.session, null);
}

function setSessionUserId(userId: string | null): void {
  setItem(KEYS.session, userId);
}

function nextConversationId(): number {
  const id = getItem<number>(KEYS.nextConversationId, 100);
  setItem(KEYS.nextConversationId, id + 1);
  return id;
}

function nextSupporterId(): number {
  const id = getItem<number>(KEYS.nextSupporterId, 100);
  setItem(KEYS.nextSupporterId, id + 1);
  return id;
}

function requireAuth(): User {
  const userId = getSessionUserId();
  if (!userId) throw new Error("Not authenticated");
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("Not authenticated");
  return user;
}

// === AUTH ===

function register(data: InsertUser): User {
  const users = getUsers();
  if (users.some((u) => u.email === data.email)) {
    throw new Error("A user with this email already exists");
  }
  const now = new Date().toISOString();
  const user: User = {
    id: crypto.randomUUID(),
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    createdAt: now,
    updatedAt: now,
  };
  setUsers([...users, user]);
  setSessionUserId(user.id);

  // Seed demo data on first registration
  if (!localStorage.getItem(KEYS.initialized)) {
    // Dynamically import to keep adapter lean
    import("./seed-data").then(({ injectSeedData }) => {
      injectSeedData(user.id);
    });
    localStorage.setItem(KEYS.initialized, "true");
  }

  return user;
}

function login(credentials: { email: string; password: string }): User {
  const users = getUsers();
  const user = users.find(
    (u) => u.email === credentials.email && u.password === credentials.password
  );
  if (!user) throw new Error("Invalid email or password");
  setSessionUserId(user.id);
  return user;
}

function loginDemoSupporter(): User {
  const users = getUsers();
  const user = users.find((candidate) => candidate.id === DEMO_SUPPORTER_ID);
  if (!user) {
    throw new Error("Demo supporter is not available");
  }
  setSessionUserId(user.id);
  return user;
}

function logout(): void {
  setSessionUserId(null);
}

function getCurrentUser(): User | null {
  const userId = getSessionUserId();
  if (!userId) return null;
  const users = getUsers();
  return users.find((u) => u.id === userId) ?? null;
}

// === CONVERSATIONS ===

function getConversations(): Conversation[] {
  const user = requireAuth();
  const allConversations = getConversationsStore();
  const supporters = getSupportersStore();

  // Get IDs of users who support me or who I support
  const relatedUserIds = new Set<string>();
  relatedUserIds.add(user.id);
  for (const s of supporters) {
    if (s.status !== "accepted") continue;
    if (s.memberId === user.id) relatedUserIds.add(s.supporterId);
    if (s.supporterId === user.id) relatedUserIds.add(s.memberId);
  }

  return allConversations.filter((c) => relatedUserIds.has(c.memberId));
}

function getConversation(id: number): Conversation | null {
  const user = requireAuth();
  const allConversations = getConversationsStore();
  const conversation = allConversations.find((c) => c.id === id);
  if (!conversation) return null;

  // Access check: own conversation or supporter relationship
  if (conversation.memberId === user.id) return conversation;
  const supporters = getSupportersStore();
  const hasAccess = supporters.some(
    (s) =>
      s.status === "accepted" &&
      ((s.memberId === conversation.memberId && s.supporterId === user.id) ||
        (s.supporterId === conversation.memberId && s.memberId === user.id))
  );
  if (!hasAccess) throw new Error("You do not have access to this conversation");
  return conversation;
}

function createConversation(data: { title: string; initialMessage: string }): Conversation {
  const user = requireAuth();
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: nextConversationId(),
    memberId: user.id,
    title: data.title,
    data: {
      messages: [
        {
          id: crypto.randomUUID(),
          authorId: user.id,
          authorName: user.firstName || user.email,
          content: data.initialMessage,
          timestamp: now,
        },
      ],
    },
    createdAt: now,
    memberName: user.firstName,
  };
  const all = getConversationsStore();
  setConversationsStore([...all, conversation]);
  return conversation;
}

function addMessage(
  conversationId: number,
  data: { content: string; parentMessageId?: string; images?: string[] }
): Conversation {
  const user = requireAuth();
  const all = getConversationsStore();
  const idx = all.findIndex((c) => c.id === conversationId);
  if (idx === -1) throw new Error("Conversation not found");

  const conversation = { ...all[idx] };

  // Access check
  if (conversation.memberId !== user.id) {
    const supporters = getSupportersStore();
    const hasAccess = supporters.some(
      (s) =>
        s.status === "accepted" &&
        ((s.memberId === conversation.memberId && s.supporterId === user.id) ||
          (s.supporterId === conversation.memberId && s.memberId === user.id))
    );
    if (!hasAccess) throw new Error("You do not have access to this conversation");
  }

  const newMessage: Message = {
    id: crypto.randomUUID(),
    authorId: user.id,
    authorName: user.firstName || user.email,
    content: data.content,
    timestamp: new Date().toISOString(),
    images: data.images,
  };

  conversation.data = {
    messages: [...conversation.data.messages, newMessage],
  };

  const updated = [...all];
  updated[idx] = conversation;
  setConversationsStore(updated);
  return conversation;
}

// === SUPPORTERS ===

function getSupporters(): {
  mySupporters: (Supporter & { supporterName?: string; supporterEmail?: string })[];
  supporting: (Supporter & { memberName?: string; memberEmail?: string })[];
} {
  const user = requireAuth();
  const allSupporters = getSupportersStore();
  const users = getUsers();

  const mySupporters = allSupporters
    .filter((s) => s.memberId === user.id)
    .map((s) => {
      const supporter = users.find((u) => u.id === s.supporterId);
      return {
        ...s,
        supporterName: supporter?.firstName,
        supporterEmail: supporter?.email,
      };
    });

  const supporting = allSupporters
    .filter((s) => s.supporterId === user.id)
    .map((s) => {
      const member = users.find((u) => u.id === s.memberId);
      return {
        ...s,
        memberName: member?.firstName,
        memberEmail: member?.email,
      };
    });

  return { mySupporters, supporting };
}

function inviteSupporter(data: { email: string }): Supporter {
  const user = requireAuth();
  const users = getUsers();
  let targetUser = users.find((u) => u.email === data.email);

  // Auto-create mock user if not found
  if (!targetUser) {
    const now = new Date().toISOString();
    const mockName = data.email.split("@")[0];
    targetUser = {
      id: crypto.randomUUID(),
      email: data.email,
      password: crypto.randomUUID(),
      firstName: mockName.charAt(0).toUpperCase() + mockName.slice(1),
      createdAt: now,
      updatedAt: now,
    };
    setUsers([...users, targetUser]);

    // Generate sample conversations for the mock user
    const convId1 = nextConversationId();
    const newConversations: Conversation[] = [
      {
        id: convId1,
        memberId: targetUser.id,
        title: `${targetUser.firstName}'s Update`,
        data: {
          messages: [
            {
              id: crypto.randomUUID(),
              authorId: targetUser.id,
              authorName: targetUser.firstName || targetUser.email,
              content:
                "Thanks for connecting! Looking forward to sharing updates with my support network.",
              timestamp: now,
            },
          ],
        },
        createdAt: now,
        memberName: targetUser.firstName,
      },
    ];
    setConversationsStore([...getConversationsStore(), ...newConversations]);
  }

  // Create bidirectional supporter relationships
  const now = new Date().toISOString();
  const supporter: Supporter = {
    id: nextSupporterId(),
    memberId: user.id,
    supporterId: targetUser.id,
    status: "accepted",
    createdAt: now,
  };
  const reverse: Supporter = {
    id: nextSupporterId(),
    memberId: targetUser.id,
    supporterId: user.id,
    status: "accepted",
    createdAt: now,
  };
  setSupportersStore([...getSupportersStore(), supporter, reverse]);
  return supporter;
}

function updateSupporterStatus(id: number, status: "accepted" | "rejected"): Supporter {
  requireAuth();
  const all = getSupportersStore();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Supporter relationship not found");
  const updated = [...all];
  updated[idx] = { ...updated[idx], status };
  setSupportersStore(updated);
  return updated[idx];
}

// === STORAGE MANAGEMENT ===

async function getStorageUsagePercent(): Promise<number> {
  if (navigator.storage?.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    if (quota && usage) return (usage / quota) * 100;
  }
  // Fallback: estimate from localStorage string length
  let total = 0;
  for (const key of Object.keys(localStorage)) {
    total += localStorage.getItem(key)?.length ?? 0;
  }
  // Assume 5MB limit, 2 bytes per char
  return ((total * 2) / (5 * 1024 * 1024)) * 100;
}

function resetAllData(): void {
  for (const key of Object.values(KEYS)) {
    localStorage.removeItem(key);
  }
}

function isStorageAvailable(): boolean {
  try {
    const testKey = "supportSpark_test";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// === EXPORT ===

export const storage = {
  register,
  login,
  loginDemoSupporter,
  logout,
  getCurrentUser,
  getConversations,
  getConversation,
  createConversation,
  addMessage,
  getSupporters,
  inviteSupporter,
  updateSupporterStatus,
  getStorageUsagePercent,
  resetAllData,
  isStorageAvailable,
};

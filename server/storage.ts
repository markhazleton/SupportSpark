import { type User, type InsertUser, type Conversation, type Supporter, type Message } from "@shared/schema";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export interface IStorage {
  // User Operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Conversation Operations
  getConversationsForUser(userId: string): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(memberId: string, title: string, initialMessage: Message): Promise<Conversation>;
  updateConversation(id: number, conversation: Conversation): Promise<Conversation>;

  // Supporter Operations
  getSupportersForMember(memberId: string): Promise<Supporter[]>;
  getSupportingMembers(supporterId: string): Promise<Supporter[]>;
  createSupporter(memberId: string, supporterId: string): Promise<Supporter>;
  updateSupporterStatus(id: number, status: "accepted" | "rejected"): Promise<Supporter>;
  getSupporterRecord(memberId: string, supporterId: string): Promise<Supporter | undefined>;
}

interface ConversationIndex {
  id: number;
  memberId: string;
  title: string;
  createdAt: string;
}

interface ConversationMeta {
  lastConversationId: number;
}

export class FileStorage implements IStorage {
  private dataDir = path.join(process.cwd(), "data");
  private usersFile = path.join(this.dataDir, "users.json");
  private supportersFile = path.join(this.dataDir, "supporters.json");
  private conversationsDir = path.join(this.dataDir, "conversations");
  private conversationIndexFile = path.join(this.conversationsDir, "index.json");
  private conversationMetaFile = path.join(this.conversationsDir, "meta.json");

  // In-memory cache
  private users: Map<string, User> = new Map();
  private conversationIndex: Map<number, ConversationIndex> = new Map();
  private supporters: Map<number, Supporter> = new Map();
  private currentConversationId = 1;
  private currentSupporterId = 1;
  private initialized = false;

  constructor() {
    this.init();
  }

  // Demo account IDs (deterministic for easy lookup)
  static DEMO_MEMBER_ID = "demo-member-sarah";
  static DEMO_SUPPORTER_ID = "demo-supporter-james";

  private async init() {
    if (this.initialized) return;
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.conversationsDir, { recursive: true });
      await this.loadData();
      await this.ensureDemoData();
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing storage:", error);
    }
  }

  private async ensureDemoData() {
    // Check if demo member exists
    // Demo accounts use random UUIDs as passwords to prevent standard login
    const demoPasswordBlocker = `DEMO_ONLY_${randomUUID()}`;

    if (!this.users.has(FileStorage.DEMO_MEMBER_ID)) {
      const demoMember: User = {
        id: FileStorage.DEMO_MEMBER_ID,
        email: "sarah@demo.supportspark.com",
        password: demoPasswordBlocker,
        passwordVersion: 'bcrypt-10', // Demo accounts bypass normal auth but need version field
        firstName: "Sarah",
        lastName: "Mitchell",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.users.set(demoMember.id, demoMember);
      await this.persistUsers();
    }

    // Check if demo supporter exists
    if (!this.users.has(FileStorage.DEMO_SUPPORTER_ID)) {
      const demoSupporter: User = {
        id: FileStorage.DEMO_SUPPORTER_ID,
        email: "james@demo.supportspark.com",
        password: demoPasswordBlocker,
        passwordVersion: 'bcrypt-10', // Demo accounts bypass normal auth but need version field
        firstName: "James",
        lastName: "Chen",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.users.set(demoSupporter.id, demoSupporter);
      await this.persistUsers();
    }

    // Create supporter relationship if not exists
    // Note: We directly access the map here since we're inside init() and can't call ensureInitialized()
    const existingRelation = Array.from(this.supporters.values())
      .find(s => s.memberId === FileStorage.DEMO_MEMBER_ID && s.supporterId === FileStorage.DEMO_SUPPORTER_ID);
    if (!existingRelation) {
      const supporterId = this.currentSupporterId++;
      const supporter: Supporter = {
        id: supporterId,
        memberId: FileStorage.DEMO_MEMBER_ID,
        supporterId: FileStorage.DEMO_SUPPORTER_ID,
        status: "accepted",
        createdAt: new Date().toISOString(),
      };
      this.supporters.set(supporterId, supporter);
      await this.persistSupporters();
    }

    // Create demo conversations if none exist for demo member
    const demoConversations = Array.from(this.conversationIndex.values())
      .filter(c => c.memberId === FileStorage.DEMO_MEMBER_ID);
    
    if (demoConversations.length === 0) {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      // First conversation - Life transition
      const conversationId1 = this.currentConversationId++;
      const demoConversation1: Conversation = {
        id: conversationId1,
        memberId: FileStorage.DEMO_MEMBER_ID,
        title: "Starting fresh after a big change",
        createdAt: sevenDaysAgo.toISOString(),
        data: {
          messages: [
            {
              id: "msg-1-1",
              authorId: FileStorage.DEMO_MEMBER_ID,
              authorName: "Sarah Mitchell",
              content: "Hi everyone. I wanted to create this space to keep you all updated during this transition. As some of you know, I was laid off last week. It's been a shock, but I'm trying to stay positive and see this as an opportunity for a fresh start.",
              timestamp: sevenDaysAgo.toISOString(),
              replies: [
                {
                  id: "msg-1-1-reply-1",
                  authorId: FileStorage.DEMO_SUPPORTER_ID,
                  authorName: "James Chen",
                  content: "Sarah, I'm so sorry to hear this. We've all been thinking of you. Your skills and experience are incredible - this is just a temporary setback. We're here for whatever you need.",
                  timestamp: new Date(sevenDaysAgo.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                  replies: []
                }
              ]
            },
            {
              id: "msg-1-2",
              authorId: FileStorage.DEMO_MEMBER_ID,
              authorName: "Sarah Mitchell",
              content: "Day 2 update: Started updating my resume today. It's been a while since I've done this, but it's actually nice to reflect on what I've accomplished. Small steps forward!",
              timestamp: sixDaysAgo.toISOString(),
              replies: [
                {
                  id: "msg-1-2-reply-1",
                  authorId: FileStorage.DEMO_SUPPORTER_ID,
                  authorName: "James Chen",
                  content: "That's the spirit! Every small step counts. Happy to review your resume if you'd like another set of eyes on it.",
                  timestamp: new Date(sixDaysAgo.getTime() + 3 * 60 * 60 * 1000).toISOString(),
                  replies: []
                }
              ]
            },
            {
              id: "msg-1-3",
              authorId: FileStorage.DEMO_MEMBER_ID,
              authorName: "Sarah Mitchell",
              content: "Had a great call with a former colleague who offered to introduce me to some people in her network. It really helps to know I'm not alone in this. Thank you all for the encouraging messages.",
              timestamp: fiveDaysAgo.toISOString(),
              replies: []
            }
          ]
        }
      };

      // Second conversation - Week 1 progress
      const conversationId2 = this.currentConversationId++;
      const demoConversation2: Conversation = {
        id: conversationId2,
        memberId: FileStorage.DEMO_MEMBER_ID,
        title: "Week 1 - Finding my footing",
        createdAt: threeDaysAgo.toISOString(),
        data: {
          messages: [
            {
              id: "msg-2-1",
              authorId: FileStorage.DEMO_MEMBER_ID,
              authorName: "Sarah Mitchell",
              content: "First week has been an emotional rollercoaster. Some days I feel motivated, others I just want to stay in bed. My cat hasn't left my side - she seems to know I need extra cuddles right now.",
              timestamp: threeDaysAgo.toISOString(),
              replies: [
                {
                  id: "msg-2-1-reply-1",
                  authorId: FileStorage.DEMO_SUPPORTER_ID,
                  authorName: "James Chen",
                  content: "Those ups and downs are completely normal. Be kind to yourself - you're going through a major life change. We're all cheering for you!",
                  timestamp: new Date(threeDaysAgo.getTime() + 4 * 60 * 60 * 1000).toISOString(),
                  replies: []
                }
              ]
            },
            {
              id: "msg-2-2",
              authorId: FileStorage.DEMO_MEMBER_ID,
              authorName: "Sarah Mitchell",
              content: "Milestone today - had my first informational interview! It went really well and they mentioned a potential opening. Also established a daily routine which helps a lot. Feeling more like myself each day.",
              timestamp: twoDaysAgo.toISOString(),
              replies: [
                {
                  id: "msg-2-2-reply-1",
                  authorId: FileStorage.DEMO_SUPPORTER_ID,
                  authorName: "James Chen",
                  content: "That's amazing progress! Establishing a routine is so important. Keep celebrating those wins - they add up!",
                  timestamp: new Date(twoDaysAgo.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                  replies: []
                }
              ]
            },
            {
              id: "msg-2-3",
              authorId: FileStorage.DEMO_MEMBER_ID,
              authorName: "Sarah Mitchell",
              content: "Applied to five positions this week and feeling hopeful. Also taking time to think about what I really want in my next role. Grateful for all your support through this journey.",
              timestamp: oneDayAgo.toISOString(),
              replies: []
            }
          ]
        }
      };

      // Add both conversations to index
      for (const conv of [demoConversation1, demoConversation2]) {
        this.conversationIndex.set(conv.id, {
          id: conv.id,
          memberId: FileStorage.DEMO_MEMBER_ID,
          title: conv.title,
          createdAt: conv.createdAt
        });
        await this.writeConversationFile(conv);
      }

      await this.persistConversationIndex();
      await this.persistConversationMeta();
    }
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }

  private async loadData() {
    try {
      // Load Users
      const usersData = await this.readFile<User[]>(this.usersFile, []);
      this.users = new Map(usersData.map(u => [u.id, u]));

      // Load Conversation Index
      const indexData = await this.readFile<ConversationIndex[]>(this.conversationIndexFile, []);
      this.conversationIndex = new Map(indexData.map(c => [c.id, c]));

      // Load Conversation Meta
      const metaData = await this.readFile<ConversationMeta>(this.conversationMetaFile, { lastConversationId: 0 });
      this.currentConversationId = metaData.lastConversationId + 1;

      // Load Supporters
      const supportersData = await this.readFile<Supporter[]>(this.supportersFile, []);
      this.supporters = new Map(supportersData.map(s => [s.id, s]));
      if (supportersData.length > 0) {
        this.currentSupporterId = Math.max(...supportersData.map(s => s.id)) + 1;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  private async readFile<T>(filePath: string, defaultValue: T): Promise<T> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      if ((error as any).code === "ENOENT") {
        await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
        return defaultValue;
      }
      throw error;
    }
  }

  private async persistUsers() {
    await fs.writeFile(this.usersFile, JSON.stringify(Array.from(this.users.values()), null, 2));
  }

  private async persistConversationIndex() {
    await fs.writeFile(this.conversationIndexFile, JSON.stringify(Array.from(this.conversationIndex.values()), null, 2));
  }

  private async persistConversationMeta() {
    const meta: ConversationMeta = { lastConversationId: this.currentConversationId - 1 };
    await fs.writeFile(this.conversationMetaFile, JSON.stringify(meta, null, 2));
  }

  private async persistSupporters() {
    await fs.writeFile(this.supportersFile, JSON.stringify(Array.from(this.supporters.values()), null, 2));
  }

  private getConversationFilePath(memberId: string, conversationId: number): string {
    return path.join(this.conversationsDir, memberId, `${conversationId}.json`);
  }

  private async ensureMemberDir(memberId: string) {
    const memberDir = path.join(this.conversationsDir, memberId);
    await fs.mkdir(memberDir, { recursive: true });
  }

  private async writeConversationFile(conversation: Conversation) {
    await this.ensureMemberDir(conversation.memberId);
    const filePath = this.getConversationFilePath(conversation.memberId, conversation.id);
    const tempPath = filePath + ".tmp";
    await fs.writeFile(tempPath, JSON.stringify(conversation, null, 2));
    await fs.rename(tempPath, filePath);
  }

  private async readConversationFile(memberId: string, conversationId: number): Promise<Conversation | undefined> {
    try {
      const filePath = this.getConversationFilePath(memberId, conversationId);
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      if ((error as any).code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  // === User Operations ===

  async getUser(id: string): Promise<User | undefined> {
    await this.ensureInitialized();
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.ensureInitialized();
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensureInitialized();
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      passwordVersion: 'bcrypt-10', // Set password version for new users
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    await this.persistUsers();
    return user;
  }

  // === Conversation Operations ===

  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    await this.ensureInitialized();

    // Get accepted supporter relationships
    const supporting = await this.getSupportingMembers(userId);
    const acceptedMemberIds = supporting
      .filter(s => s.status === 'accepted')
      .map(s => s.memberId);

    // Include own conversations (as member)
    acceptedMemberIds.push(userId);

    // Get conversation IDs from index that belong to these members
    const relevantIndexEntries = Array.from(this.conversationIndex.values())
      .filter(c => acceptedMemberIds.includes(c.memberId));

    // Load full conversations from individual files
    const conversations: Conversation[] = [];
    for (const entry of relevantIndexEntries) {
      const conversation = await this.readConversationFile(entry.memberId, entry.id);
      if (conversation) {
        conversations.push(conversation);
      }
    }

    return conversations;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    await this.ensureInitialized();

    // Look up member ID from index
    const indexEntry = this.conversationIndex.get(id);
    if (!indexEntry) return undefined;

    return this.readConversationFile(indexEntry.memberId, id);
  }

  async createConversation(memberId: string, title: string, initialMessage: Message): Promise<Conversation> {
    await this.ensureInitialized();

    const id = this.currentConversationId++;
    const conversation: Conversation = {
      id,
      memberId,
      title,
      data: {
        messages: [initialMessage]
      },
      createdAt: new Date().toISOString()
    };

    // Add to index
    this.conversationIndex.set(id, {
      id,
      memberId,
      title,
      createdAt: conversation.createdAt
    });

    // Persist conversation file, index, and meta
    await this.writeConversationFile(conversation);
    await this.persistConversationIndex();
    await this.persistConversationMeta();

    return conversation;
  }

  async updateConversation(id: number, conversation: Conversation): Promise<Conversation> {
    await this.ensureInitialized();
    
    // Update index if title changed
    const indexEntry = this.conversationIndex.get(id);
    if (indexEntry && indexEntry.title !== conversation.title) {
      indexEntry.title = conversation.title;
      this.conversationIndex.set(id, indexEntry);
      await this.persistConversationIndex();
    }
    
    // Write the updated conversation file
    await this.writeConversationFile(conversation);
    
    return conversation;
  }

  // === Supporter Operations ===

  async getSupportersForMember(memberId: string): Promise<Supporter[]> {
    await this.ensureInitialized();
    return Array.from(this.supporters.values())
      .filter(s => s.memberId === memberId);
  }

  async getSupportingMembers(supporterId: string): Promise<Supporter[]> {
    await this.ensureInitialized();
    return Array.from(this.supporters.values())
      .filter(s => s.supporterId === supporterId);
  }

  async createSupporter(memberId: string, supporterId: string): Promise<Supporter> {
    await this.ensureInitialized();
    const id = this.currentSupporterId++;
    const supporter: Supporter = {
      id,
      memberId,
      supporterId,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    this.supporters.set(id, supporter);
    await this.persistSupporters();
    return supporter;
  }

  async updateSupporterStatus(id: number, status: "accepted" | "rejected"): Promise<Supporter> {
    await this.ensureInitialized();
    const supporter = this.supporters.get(id);
    if (!supporter) throw new Error("Supporter record not found");

    supporter.status = status;
    this.supporters.set(id, supporter);
    await this.persistSupporters();
    return supporter;
  }

  async getSupporterRecord(memberId: string, supporterId: string): Promise<Supporter | undefined> {
    await this.ensureInitialized();
    return Array.from(this.supporters.values())
      .find(s => s.memberId === memberId && s.supporterId === supporterId);
  }
}

export const storage = new FileStorage();

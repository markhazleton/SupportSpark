import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FileStorage } from "./storage";
import type { InsertUser, Message } from "@shared/schema";
import fs from "fs/promises";
import path from "path";

// Use a test data directory
const TEST_DATA_DIR = path.join(process.cwd(), "data-test");

describe("FileStorage", () => {
  let storage: FileStorage;

  beforeEach(async () => {
    // Clean up test directory before each test
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory after each test
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("User Operations", () => {
    beforeEach(() => {
      storage = new FileStorage();
    });

    it("should create a new user", async () => {
      const insertUser: InsertUser = {
        email: "test@example.com",
        password: "hashedpassword123",
        firstName: "Test",
        lastName: "User",
      };

      const user = await storage.createUser(insertUser);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(insertUser.email);
      expect(user.firstName).toBe(insertUser.firstName);
      expect(user.passwordVersion).toBe("bcrypt-10");
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it("should retrieve user by ID", async () => {
      const insertUser: InsertUser = {
        email: "test@example.com",
        password: "hashedpassword123",
      };

      const createdUser = await storage.createUser(insertUser);
      const retrievedUser = await storage.getUser(createdUser.id);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.email).toBe(createdUser.email);
    });

    it("should retrieve user by email", async () => {
      const insertUser: InsertUser = {
        email: "test@example.com",
        password: "hashedpassword123",
      };

      const createdUser = await storage.createUser(insertUser);
      const retrievedUser = await storage.getUserByEmail(insertUser.email);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.email).toBe(insertUser.email);
    });

    it("should return undefined for non-existent user", async () => {
      const user = await storage.getUser("non-existent-id");
      expect(user).toBeUndefined();
    });

    it("should return undefined for non-existent email", async () => {
      const user = await storage.getUserByEmail("nonexistent@example.com");
      expect(user).toBeUndefined();
    });
  });

  describe("Conversation Operations", () => {
    beforeEach(async () => {
      storage = new FileStorage();
    });

    it("should create a new conversation", async () => {
      const user = await storage.createUser({
        email: "member@example.com",
        password: "hashed",
      });

      const initialMessage: Message = {
        id: "msg-1",
        authorId: user.id,
        authorName: "Test User",
        content: "Initial message",
        timestamp: new Date().toISOString(),
      };

      const conversation = await storage.createConversation(
        user.id,
        "Test Conversation",
        initialMessage
      );

      expect(conversation).toBeDefined();
      expect(conversation.id).toBeDefined();
      expect(conversation.memberId).toBe(user.id);
      expect(conversation.title).toBe("Test Conversation");
      expect(conversation.data.messages).toHaveLength(1);
      expect(conversation.data.messages[0].content).toBe("Initial message");
    });

    it("should retrieve conversation by ID", async () => {
      const user = await storage.createUser({
        email: "member@example.com",
        password: "hashed",
      });

      const initialMessage: Message = {
        id: "msg-1",
        authorId: user.id,
        authorName: "Test User",
        content: "Test message",
        timestamp: new Date().toISOString(),
      };

      const created = await storage.createConversation(user.id, "Test", initialMessage);
      const retrieved = await storage.getConversation(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe("Test");
    });

    it("should update conversation", async () => {
      const user = await storage.createUser({
        email: "member@example.com",
        password: "hashed",
      });

      const initialMessage: Message = {
        id: "msg-1",
        authorId: user.id,
        authorName: "Test User",
        content: "Original",
        timestamp: new Date().toISOString(),
      };

      const conversation = await storage.createConversation(user.id, "Original Title", initialMessage);

      // Update title
      conversation.title = "Updated Title";
      const updated = await storage.updateConversation(conversation.id, conversation);

      expect(updated.title).toBe("Updated Title");

      // Verify persistence
      const retrieved = await storage.getConversation(conversation.id);
      expect(retrieved?.title).toBe("Updated Title");
    });

    it("should get all conversations for user", async () => {
      const user = await storage.createUser({
        email: "member@example.com",
        password: "hashed",
      });

      const message1: Message = {
        id: "msg-1",
        authorId: user.id,
        authorName: "Test User",
        content: "Message 1",
        timestamp: new Date().toISOString(),
      };

      const message2: Message = {
        id: "msg-2",
        authorId: user.id,
        authorName: "Test User",
        content: "Message 2",
        timestamp: new Date().toISOString(),
      };

      await storage.createConversation(user.id, "Conversation 1", message1);
      await storage.createConversation(user.id, "Conversation 2", message2);

      const conversations = await storage.getConversationsForUser(user.id);

      expect(conversations.length).toBeGreaterThanOrEqual(2);
      const titles = conversations.map((c) => c.title);
      expect(titles).toContain("Conversation 1");
      expect(titles).toContain("Conversation 2");
    });

    it("should return undefined for non-existent conversation", async () => {
      const conversation = await storage.getConversation(999999);
      expect(conversation).toBeUndefined();
    });
  });

  describe("Supporter Operations", () => {
    beforeEach(async () => {
      storage = new FileStorage();
    });

    it("should create supporter relationship", async () => {
      const member = await storage.createUser({
        email: "member@example.com",
        password: "hashed",
      });

      const supporter = await storage.createUser({
        email: "supporter@example.com",
        password: "hashed",
      });

      const relationship = await storage.createSupporter(member.id, supporter.id);

      expect(relationship).toBeDefined();
      expect(relationship.id).toBeDefined();
      expect(relationship.memberId).toBe(member.id);
      expect(relationship.supporterId).toBe(supporter.id);
      expect(relationship.status).toBe("pending");
    });

    it("should get supporters for member", async () => {
      const member = await storage.createUser({
        email: "member@example.com",
        password: "hashed",
      });

      const supporter1 = await storage.createUser({
        email: "supporter1@example.com",
        password: "hashed",
      });

      const supporter2 = await storage.createUser({
        email: "supporter2@example.com",
        password: "hashed",
      });

      await storage.createSupporter(member.id, supporter1.id);
      await storage.createSupporter(member.id, supporter2.id);

      const supporters = await storage.getSupportersForMember(member.id);

      expect(supporters.length).toBeGreaterThanOrEqual(2);
      const supporterIds = supporters.map((s) => s.supporterId);
      expect(supporterIds).toContain(supporter1.id);
      expect(supporterIds).toContain(supporter2.id);
    });

    it("should get members being supported", async () => {
      const member1 = await storage.createUser({
        email: "member1@example.com",
        password: "hashed",
      });

      const member2 = await storage.createUser({
        email: "member2@example.com",
        password: "hashed",
      });

      const supporter = await storage.createUser({
        email: "supporter@example.com",
        password: "hashed",
      });

      await storage.createSupporter(member1.id, supporter.id);
      await storage.createSupporter(member2.id, supporter.id);

      const supporting = await storage.getSupportingMembers(supporter.id);

      expect(supporting.length).toBeGreaterThanOrEqual(2);
      const memberIds = supporting.map((s) => s.memberId);
      expect(memberIds).toContain(member1.id);
      expect(memberIds).toContain(member2.id);
    });

    it("should update supporter status to accepted", async () => {
      const member = await storage.createUser({
        email: "member@example.com",
        password: "hashed",
      });

      const supporter = await storage.createUser({
        email: "supporter@example.com",
        password: "hashed",
      });

      const relationship = await storage.createSupporter(member.id, supporter.id);
      expect(relationship.status).toBe("pending");

      const updated = await storage.updateSupporterStatus(relationship.id, "accepted");
      expect(updated.status).toBe("accepted");
    });

    it("should update supporter status to rejected", async () => {
      const member = await storage.createUser({
        email: "member@example.com",
        password: "hashed",
      });

      const supporter = await storage.createUser({
        email: "supporter@example.com",
        password: "hashed",
      });

      const relationship = await storage.createSupporter(member.id, supporter.id);
      const updated = await storage.updateSupporterStatus(relationship.id, "rejected");
      expect(updated.status).toBe("rejected");
    });

    it("should get supporter record by member and supporter IDs", async () => {
      const member = await storage.createUser({
        email: "member@example.com",
        password: "hashed",
      });

      const supporter = await storage.createUser({
        email: "supporter@example.com",
        password: "hashed",
      });

      await storage.createSupporter(member.id, supporter.id);

      const record = await storage.getSupporterRecord(member.id, supporter.id);

      expect(record).toBeDefined();
      expect(record?.memberId).toBe(member.id);
      expect(record?.supporterId).toBe(supporter.id);
    });

    it("should return undefined for non-existent supporter record", async () => {
      const record = await storage.getSupporterRecord("non-existent-1", "non-existent-2");
      expect(record).toBeUndefined();
    });
  });

  describe("Atomic Write Operations (STORAGE1 Fix)", () => {
    beforeEach(async () => {
      storage = new FileStorage();
    });

    it("should persist user data atomically", async () => {
      const user1 = await storage.createUser({
        email: "user1@example.com",
        password: "hashed",
      });

      const user2 = await storage.createUser({
        email: "user2@example.com",
        password: "hashed",
      });

      // Both users should be retrievable
      const retrieved1 = await storage.getUser(user1.id);
      const retrieved2 = await storage.getUser(user2.id);

      expect(retrieved1).toBeDefined();
      expect(retrieved2).toBeDefined();
      expect(retrieved1?.email).toBe("user1@example.com");
      expect(retrieved2?.email).toBe("user2@example.com");
    });

    it("should handle concurrent conversation creation", async () => {
      const user = await storage.createUser({
        email: "member@example.com",
        password: "hashed",
      });

      const message1: Message = {
        id: "msg-1",
        authorId: user.id,
        authorName: "User",
        content: "First",
        timestamp: new Date().toISOString(),
      };

      const message2: Message = {
        id: "msg-2",
        authorId: user.id,
        authorName: "User",
        content: "Second",
        timestamp: new Date().toISOString(),
      };

      // Create conversations concurrently
      const [conv1, conv2] = await Promise.all([
        storage.createConversation(user.id, "Conv 1", message1),
        storage.createConversation(user.id, "Conv 2", message2),
      ]);

      expect(conv1.id).not.toBe(conv2.id);
      expect(conv1.title).toBe("Conv 1");
      expect(conv2.title).toBe("Conv 2");

      // Both should be retrievable
      const retrieved1 = await storage.getConversation(conv1.id);
      const retrieved2 = await storage.getConversation(conv2.id);

      expect(retrieved1).toBeDefined();
      expect(retrieved2).toBeDefined();
    });
  });

  describe("Demo Data", () => {
    beforeEach(async () => {
      storage = new FileStorage();
    });

    it("should create demo member and supporter accounts", async () => {
      const demoMember = await storage.getUser(FileStorage.DEMO_MEMBER_ID);
      const demoSupporter = await storage.getUser(FileStorage.DEMO_SUPPORTER_ID);

      expect(demoMember).toBeDefined();
      expect(demoSupporter).toBeDefined();
      expect(demoMember?.email).toContain("demo.supportspark.com");
      expect(demoSupporter?.email).toContain("demo.supportspark.com");
    });

    it("should create demo conversations", async () => {
      const conversations = await storage.getConversationsForUser(FileStorage.DEMO_MEMBER_ID);

      expect(conversations.length).toBeGreaterThan(0);
      expect(conversations.some((c) => c.memberId === FileStorage.DEMO_MEMBER_ID)).toBe(true);
    });

    it("should create demo supporter relationship", async () => {
      const relationship = await storage.getSupporterRecord(
        FileStorage.DEMO_MEMBER_ID,
        FileStorage.DEMO_SUPPORTER_ID
      );

      expect(relationship).toBeDefined();
      expect(relationship?.status).toBe("accepted");
    });
  });
});

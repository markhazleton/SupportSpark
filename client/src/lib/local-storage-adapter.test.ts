import { describe, it, expect, beforeEach } from "vitest";
import { storage } from "./local-storage-adapter";

describe("LocalStorageAdapter", () => {
  beforeEach(() => {
    storage.resetAllData();
  });

  describe("isStorageAvailable", () => {
    it("returns true when localStorage is available", () => {
      expect(storage.isStorageAvailable()).toBe(true);
    });
  });

  describe("register", () => {
    it("registers a new user and sets session", () => {
      const user = storage.register({
        email: "test@example.com",
        password: "password123",
        firstName: "Test",
      });
      expect(user.email).toBe("test@example.com");
      expect(user.firstName).toBe("Test");
      expect(user.id).toBeDefined();
      expect(storage.getCurrentUser()?.id).toBe(user.id);
    });

    it("throws on duplicate email", () => {
      storage.register({ email: "dup@example.com", password: "password123" });
      expect(() => storage.register({ email: "dup@example.com", password: "password456" })).toThrow(
        "A user with this email already exists"
      );
    });
  });

  describe("login", () => {
    it("logs in with correct credentials", () => {
      storage.register({ email: "user@test.com", password: "mypassword" });
      storage.logout();
      const user = storage.login({ email: "user@test.com", password: "mypassword" });
      expect(user.email).toBe("user@test.com");
      expect(storage.getCurrentUser()?.email).toBe("user@test.com");
    });

    it("throws on wrong password", () => {
      storage.register({ email: "user@test.com", password: "mypassword" });
      storage.logout();
      expect(() => storage.login({ email: "user@test.com", password: "wrong" })).toThrow(
        "Invalid email or password"
      );
    });

    it("throws on non-existent email", () => {
      expect(() => storage.login({ email: "nobody@test.com", password: "pass" })).toThrow(
        "Invalid email or password"
      );
    });
  });

  describe("logout", () => {
    it("clears session but preserves data", () => {
      storage.register({ email: "user@test.com", password: "pass1234" });
      storage.logout();
      expect(storage.getCurrentUser()).toBeNull();
      // Data still exists — re-login works
      const user = storage.login({ email: "user@test.com", password: "pass1234" });
      expect(user.email).toBe("user@test.com");
    });
  });

  describe("getCurrentUser", () => {
    it("returns null when no session", () => {
      expect(storage.getCurrentUser()).toBeNull();
    });

    it("returns user when session exists", () => {
      const user = storage.register({ email: "a@b.com", password: "password123" });
      expect(storage.getCurrentUser()?.id).toBe(user.id);
    });
  });

  describe("conversations CRUD", () => {
    let userId: string;

    beforeEach(() => {
      const user = storage.register({ email: "conv@test.com", password: "password123" });
      userId = user.id;
    });

    it("creates a conversation", () => {
      const conv = storage.createConversation({
        title: "My Update",
        initialMessage: "Hello world",
      });
      expect(conv.title).toBe("My Update");
      expect(conv.memberId).toBe(userId);
      expect(conv.data.messages).toHaveLength(1);
      expect(conv.data.messages[0].content).toBe("Hello world");
    });

    it("lists own conversations", () => {
      storage.createConversation({ title: "C1", initialMessage: "msg1" });
      storage.createConversation({ title: "C2", initialMessage: "msg2" });
      const list = storage.getConversations();
      expect(list).toHaveLength(2);
    });

    it("gets a single conversation", () => {
      const conv = storage.createConversation({ title: "Single", initialMessage: "test" });
      const fetched = storage.getConversation(conv.id);
      expect(fetched?.title).toBe("Single");
    });

    it("returns null for non-existent conversation", () => {
      expect(storage.getConversation(9999)).toBeNull();
    });

    it("adds a message to a conversation", () => {
      const conv = storage.createConversation({ title: "Thread", initialMessage: "first" });
      const updated = storage.addMessage(conv.id, { content: "reply" });
      expect(updated.data.messages).toHaveLength(2);
      expect(updated.data.messages[1].content).toBe("reply");
    });
  });

  describe("supporters CRUD", () => {
    beforeEach(() => {
      storage.register({ email: "member@test.com", password: "password123" });
    });

    it("invites a supporter with auto-accept and mock user", () => {
      const supporter = storage.inviteSupporter({ email: "friend@test.com" });
      expect(supporter.status).toBe("accepted");

      const { mySupporters } = storage.getSupporters();
      expect(mySupporters).toHaveLength(1);
      expect(mySupporters[0].supporterEmail).toBe("friend@test.com");
    });

    it("creates bidirectional relationship on invite", () => {
      storage.inviteSupporter({ email: "buddy@test.com" });
      const { mySupporters, supporting } = storage.getSupporters();
      expect(mySupporters).toHaveLength(1);
      // The reverse relationship means the mock user "supports" us too
      // But since we're logged in as the member, "supporting" shows where we are the supporter
      expect(supporting).toHaveLength(1);
    });

    it("updates supporter status", () => {
      const supporter = storage.inviteSupporter({ email: "s@test.com" });
      const updated = storage.updateSupporterStatus(supporter.id, "rejected");
      expect(updated.status).toBe("rejected");
    });

    it("throws on non-existent supporter", () => {
      expect(() => storage.updateSupporterStatus(9999, "accepted")).toThrow(
        "Supporter relationship not found"
      );
    });
  });

  describe("resetAllData", () => {
    it("clears all supportSpark_ keys", () => {
      storage.register({ email: "reset@test.com", password: "password123" });
      storage.createConversation({ title: "test", initialMessage: "msg" });
      storage.resetAllData();
      expect(storage.getCurrentUser()).toBeNull();
      // After reset, need to register again to do anything
    });
  });

  describe("seed data injection", () => {
    it("seeds data on first registration", async () => {
      storage.register({ email: "first@test.com", password: "password123", firstName: "First" });
      // Wait for dynamic import to complete
      await new Promise((r) => setTimeout(r, 100));
      const conversations = storage.getConversations();
      // Should have seed conversations (2 own + 2 from Alex via supporter)
      expect(conversations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("getStorageUsagePercent", () => {
    it("returns a number between 0 and 100", async () => {
      const pct = await storage.getStorageUsagePercent();
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    });
  });
});

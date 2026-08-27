import { describe, it, expect, beforeEach } from "vitest";
import { injectSeedData } from "./seed-data";
import { storage } from "./local-storage-adapter";

describe("seed-data", () => {
  beforeEach(() => {
    storage.resetAllData();
    // Set up a registered user in localStorage for seed data to reference
    const users = [
      {
        id: "test-user-001",
        email: "test@example.com",
        password: "password123",
        firstName: "TestUser",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem("supportSpark_users", JSON.stringify(users));
  });

  it("creates seed supporter user", () => {
    injectSeedData("test-user-001");
    const users = JSON.parse(localStorage.getItem("supportSpark_users") || "[]");
    const alex = users.find((u: { id: string }) => u.id === "seed-supporter-001");
    expect(alex).toBeDefined();
    expect(alex.firstName).toBe("Alex");
    expect(alex.lastName).toBe("Rivera");
    expect(alex.email).toBe("alex.supporter@example.com");
  });

  it("creates My Journey conversations for registered user", () => {
    injectSeedData("test-user-001");
    const conversations = JSON.parse(localStorage.getItem("supportSpark_conversations") || "[]");
    const myJourney = conversations.filter(
      (c: { memberId: string }) => c.memberId === "test-user-001"
    );
    expect(myJourney).toHaveLength(2);
    expect(myJourney[0].title).toBe("Starting My Recovery Journey");
    expect(myJourney[1].title).toBe("Grateful for Small Wins");
  });

  it("creates Following conversations for seed supporter", () => {
    injectSeedData("test-user-001");
    const conversations = JSON.parse(localStorage.getItem("supportSpark_conversations") || "[]");
    const following = conversations.filter(
      (c: { memberId: string }) => c.memberId === "seed-supporter-001"
    );
    expect(following).toHaveLength(2);
    expect(following[0].title).toBe("Managing Daily Challenges");
    expect(following[1].title).toBe("Finding Community Support");
  });

  it("creates bidirectional supporter relationships", () => {
    injectSeedData("test-user-001");
    const supporters = JSON.parse(localStorage.getItem("supportSpark_supporters") || "[]");
    expect(supporters).toHaveLength(2);

    const forward = supporters.find(
      (s: { memberId: string; supporterId: string }) =>
        s.memberId === "test-user-001" && s.supporterId === "seed-supporter-001"
    );
    const reverse = supporters.find(
      (s: { memberId: string; supporterId: string }) =>
        s.memberId === "seed-supporter-001" && s.supporterId === "test-user-001"
    );
    expect(forward).toBeDefined();
    expect(reverse).toBeDefined();
    expect(forward.status).toBe("accepted");
    expect(reverse.status).toBe("accepted");
  });

  it("sets next ID counters to 100", () => {
    injectSeedData("test-user-001");
    expect(JSON.parse(localStorage.getItem("supportSpark_nextConversationId") || "0")).toBe(100);
    expect(JSON.parse(localStorage.getItem("supportSpark_nextSupporterId") || "0")).toBe(100);
  });

  it("uses registered user name in conversation messages", () => {
    injectSeedData("test-user-001");
    const conversations = JSON.parse(localStorage.getItem("supportSpark_conversations") || "[]");
    const myConv = conversations.find((c: { memberId: string }) => c.memberId === "test-user-001");
    expect(myConv.data.messages[0].authorName).toBe("TestUser");
  });
});

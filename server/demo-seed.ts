import type { Conversation, Supporter, User } from "@shared/schema";

export const DEMO_MEMBER_ID = "demo-member-sarah";
export const DEMO_SUPPORTER_ID = "demo-supporter-james";

interface DemoSeedOptions {
  referenceDate?: Date;
  password: string;
  startingConversationId: number;
  supporterRelationshipId: number;
}

interface DemoSeedData {
  users: User[];
  supporter: Supporter;
  conversations: Conversation[];
  nextConversationId: number;
  nextSupporterId: number;
}

export function buildDemoSeedData({
  referenceDate = new Date(),
  password,
  startingConversationId,
  supporterRelationshipId,
}: DemoSeedOptions): DemoSeedData {
  const now = referenceDate;
  const timestamps = {
    created: now.toISOString(),
    sevenDaysAgo: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    sixDaysAgo: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    fiveDaysAgo: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    threeDaysAgo: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    twoDaysAgo: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    oneDayAgo: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const users: User[] = [
    {
      id: DEMO_MEMBER_ID,
      email: "sarah@demo.supportspark.com",
      password,
      passwordVersion: "bcrypt-10",
      firstName: "Sarah",
      lastName: "Mitchell",
      createdAt: timestamps.created,
      updatedAt: timestamps.created,
    },
    {
      id: DEMO_SUPPORTER_ID,
      email: "james@demo.supportspark.com",
      password,
      passwordVersion: "bcrypt-10",
      firstName: "James",
      lastName: "Chen",
      createdAt: timestamps.created,
      updatedAt: timestamps.created,
    },
  ];

  const supporter: Supporter = {
    id: supporterRelationshipId,
    memberId: DEMO_MEMBER_ID,
    supporterId: DEMO_SUPPORTER_ID,
    status: "accepted",
    createdAt: timestamps.created,
  };

  const firstConversationId = startingConversationId;
  const secondConversationId = startingConversationId + 1;

  const conversations: Conversation[] = [
    {
      id: firstConversationId,
      memberId: DEMO_MEMBER_ID,
      title: "Starting fresh after a big change",
      createdAt: timestamps.sevenDaysAgo,
      data: {
        messages: [
          {
            id: "msg-1-1",
            authorId: DEMO_MEMBER_ID,
            authorName: "Sarah Mitchell",
            content:
              "Hi everyone. I wanted to create this space to keep you all updated during this transition. As some of you know, I was laid off last week. It's been a shock, but I'm trying to stay positive and see this as an opportunity for a fresh start.",
            timestamp: timestamps.sevenDaysAgo,
            replies: [
              {
                id: "msg-1-1-reply-1",
                authorId: DEMO_SUPPORTER_ID,
                authorName: "James Chen",
                content:
                  "Sarah, I'm so sorry to hear this. We've all been thinking of you. Your skills and experience are incredible - this is just a temporary setback. We're here for whatever you need.",
                timestamp: new Date(
                  new Date(timestamps.sevenDaysAgo).getTime() + 2 * 60 * 60 * 1000
                ).toISOString(),
                replies: [],
              },
            ],
          },
          {
            id: "msg-1-2",
            authorId: DEMO_MEMBER_ID,
            authorName: "Sarah Mitchell",
            content:
              "Day 2 update: Started updating my resume today. It's been a while since I've done this, but it's actually nice to reflect on what I've accomplished. Small steps forward!",
            timestamp: timestamps.sixDaysAgo,
            replies: [
              {
                id: "msg-1-2-reply-1",
                authorId: DEMO_SUPPORTER_ID,
                authorName: "James Chen",
                content:
                  "That's the spirit! Every small step counts. Happy to review your resume if you'd like another set of eyes on it.",
                timestamp: new Date(
                  new Date(timestamps.sixDaysAgo).getTime() + 3 * 60 * 60 * 1000
                ).toISOString(),
                replies: [],
              },
            ],
          },
          {
            id: "msg-1-3",
            authorId: DEMO_MEMBER_ID,
            authorName: "Sarah Mitchell",
            content:
              "Had a great call with a former colleague who offered to introduce me to some people in her network. It really helps to know I'm not alone in this. Thank you all for the encouraging messages.",
            timestamp: timestamps.fiveDaysAgo,
            replies: [],
          },
        ],
      },
    },
    {
      id: secondConversationId,
      memberId: DEMO_MEMBER_ID,
      title: "Week 1 - Finding my footing",
      createdAt: timestamps.threeDaysAgo,
      data: {
        messages: [
          {
            id: "msg-2-1",
            authorId: DEMO_MEMBER_ID,
            authorName: "Sarah Mitchell",
            content:
              "First week has been an emotional rollercoaster. Some days I feel motivated, others I just want to stay in bed. My cat hasn't left my side - she seems to know I need extra cuddles right now.",
            timestamp: timestamps.threeDaysAgo,
            replies: [
              {
                id: "msg-2-1-reply-1",
                authorId: DEMO_SUPPORTER_ID,
                authorName: "James Chen",
                content:
                  "Those ups and downs are completely normal. Be kind to yourself - you're going through a major life change. We're all cheering for you!",
                timestamp: new Date(
                  new Date(timestamps.threeDaysAgo).getTime() + 4 * 60 * 60 * 1000
                ).toISOString(),
                replies: [],
              },
            ],
          },
          {
            id: "msg-2-2",
            authorId: DEMO_MEMBER_ID,
            authorName: "Sarah Mitchell",
            content:
              "Milestone today - had my first informational interview! It went really well and they mentioned a potential opening. Also established a daily routine which helps a lot. Feeling more like myself each day.",
            timestamp: timestamps.twoDaysAgo,
            replies: [
              {
                id: "msg-2-2-reply-1",
                authorId: DEMO_SUPPORTER_ID,
                authorName: "James Chen",
                content:
                  "That's amazing progress! Establishing a routine is so important. Keep celebrating those wins - they add up!",
                timestamp: new Date(
                  new Date(timestamps.twoDaysAgo).getTime() + 2 * 60 * 60 * 1000
                ).toISOString(),
                replies: [],
              },
            ],
          },
          {
            id: "msg-2-3",
            authorId: DEMO_MEMBER_ID,
            authorName: "Sarah Mitchell",
            content:
              "Applied to five positions this week and feeling hopeful. Also taking time to think about what I really want in my next role. Grateful for all your support through this journey.",
            timestamp: timestamps.oneDayAgo,
            replies: [],
          },
        ],
      },
    },
  ];

  return {
    users,
    supporter,
    conversations,
    nextConversationId: secondConversationId + 1,
    nextSupporterId: supporterRelationshipId + 1,
  };
}

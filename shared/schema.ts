import { z } from "zod";

// === USER SCHEMA ===
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string(), // Hashed in a real app, keeping simple for now
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
  createdAt: z.string().optional(), // ISO String
});

export const insertUserSchema = userSchema.pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// === CONVERSATION SCHEMA ===
// Threaded conversation structure
export type Message = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
  images?: string[];
  replies?: Message[];
};

export const messageSchema: z.ZodType<Message> = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  content: z.string(),
  timestamp: z.string(),
  images: z.array(z.string()).optional(),
  replies: z.lazy(() => z.array(messageSchema)).optional(), // Recursive for replies
});

export const conversationSchema = z.object({
  id: z.number(), // Keeping number to match previous routes structure
  memberId: z.string(), // Links to User.id (person seeking support)
  title: z.string(),
  data: z.object({
    messages: z.array(messageSchema),
  }),
  createdAt: z.string(),
  memberName: z.string().optional(),
});

export const insertConversationSchema = z.object({
  title: z.string(),
  initialMessage: z.string(),
});

export type Conversation = z.infer<typeof conversationSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

// === SUPPORTER SCHEMA ===
export const supporterSchema = z.object({
  id: z.number(),
  memberId: z.string(),
  supporterId: z.string(),
  status: z.enum(["pending", "accepted", "rejected"]),
  createdAt: z.string(),
});

export const insertSupporterSchema = z.object({
  email: z.string().email(), // We use email to invite
});

export type Supporter = z.infer<typeof supporterSchema>;
export type InsertSupporter = z.infer<typeof insertSupporterSchema>; // Helper for types, though invite uses email

// === API REQUEST/RESPONSE TYPES ===
export type CreateConversationRequest = InsertConversation;
export type AddMessageRequest = { content: string; parentMessageId?: string; images?: string[] };
export type InviteSupporterRequest = { email: string };
export type UpdateSupporterStatusRequest = { status: "accepted" | "rejected" };

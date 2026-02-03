import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useConversations,
  useConversation,
  useCreateConversation,
  useAddMessage,
} from "./use-conversations";
import type { Conversation } from "@shared/schema";

// Mock fetch globally
global.fetch = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useConversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch all conversations", async () => {
    const mockConversations: Conversation[] = [
      {
        id: 1,
        memberId: "user-123",
        title: "Test Conversation",
        data: { messages: [] },
        createdAt: new Date().toISOString(),
      },
    ];

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversations,
    });

    const { result } = renderHook(() => useConversations(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockConversations);
    });
  });

  it("should handle fetch errors", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useConversations(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch single conversation by ID", async () => {
    const mockConversation: Conversation = {
      id: 1,
      memberId: "user-123",
      title: "Test Conversation",
      data: {
        messages: [
          {
            id: "msg-1",
            authorId: "user-123",
            authorName: "Test User",
            content: "Hello",
            timestamp: new Date().toISOString(),
          },
        ],
      },
      createdAt: new Date().toISOString(),
    };

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversation,
    });

    const { result } = renderHook(() => useConversation(1), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockConversation);
    });
  });

  it("should return null for 404", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 404,
      ok: false,
    });

    const { result } = renderHook(() => useConversation(999), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeNull();
    });
  });
});

describe("useCreateConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new conversation", async () => {
    const mockConversation: Conversation = {
      id: 1,
      memberId: "user-123",
      title: "New Update",
      data: {
        messages: [
          {
            id: "msg-1",
            authorId: "user-123",
            authorName: "Test User",
            content: "Initial message",
            timestamp: new Date().toISOString(),
          },
        ],
      },
      createdAt: new Date().toISOString(),
    };

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversation,
    });

    const { result } = renderHook(() => useCreateConversation(), { wrapper: createWrapper() });

    result.current.mutate({
      title: "New Update",
      initialMessage: "Initial message",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockConversation);
    });
  });

  it("should handle creation errors", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useCreateConversation(), { wrapper: createWrapper() });

    result.current.mutate({
      title: "New Update",
      initialMessage: "Initial message",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useAddMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should add a message to conversation", async () => {
    const mockConversation: Conversation = {
      id: 1,
      memberId: "user-123",
      title: "Test Conversation",
      data: {
        messages: [
          {
            id: "msg-1",
            authorId: "user-123",
            authorName: "Test User",
            content: "Original message",
            timestamp: new Date().toISOString(),
          },
          {
            id: "msg-2",
            authorId: "user-123",
            authorName: "Test User",
            content: "New message",
            timestamp: new Date().toISOString(),
          },
        ],
      },
      createdAt: new Date().toISOString(),
    };

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversation,
    });

    const { result } = renderHook(() => useAddMessage(1), { wrapper: createWrapper() });

    result.current.mutate({
      content: "New message",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.data.messages).toHaveLength(2);
    });
  });

  it("should add a reply to a message", async () => {
    const mockConversation: Conversation = {
      id: 1,
      memberId: "user-123",
      title: "Test Conversation",
      data: {
        messages: [
          {
            id: "msg-1",
            authorId: "user-123",
            authorName: "Test User",
            content: "Original message",
            timestamp: new Date().toISOString(),
            replies: [
              {
                id: "msg-1-reply-1",
                authorId: "user-456",
                authorName: "Supporter",
                content: "Reply to message",
                timestamp: new Date().toISOString(),
              },
            ],
          },
        ],
      },
      createdAt: new Date().toISOString(),
    };

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversation,
    });

    const { result } = renderHook(() => useAddMessage(1), { wrapper: createWrapper() });

    result.current.mutate({
      content: "Reply to message",
      parentMessageId: "msg-1",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.data.messages[0].replies).toHaveLength(1);
    });
  });
});

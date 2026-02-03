import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useSupporters,
  useInviteSupporter,
  useUpdateSupporterStatus,
} from "./use-supporters";
import type { Supporter } from "@shared/schema";

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

describe("useSupporters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch supporters list", async () => {
    const mockResponse = {
      mySupporters: [
        {
          id: 1,
          memberId: "user-123",
          supporterId: "user-456",
          status: "accepted" as const,
          createdAt: new Date().toISOString(),
          supporterName: "John Doe",
          supporterEmail: "john@example.com",
        },
      ],
      supporting: [],
    };

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useSupporters(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockResponse);
    });
  });

  it("should handle fetch errors", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useSupporters(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useInviteSupporter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should invite a supporter by email", async () => {
    const mockSupporter: Supporter = {
      id: 1,
      memberId: "user-123",
      supporterId: "user-456",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSupporter,
    });

    const { result } = renderHook(() => useInviteSupporter(), { wrapper: createWrapper() });

    result.current.mutate({
      email: "supporter@example.com",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockSupporter);
    });
  });

  it("should handle 404 when user not found", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 404,
      ok: false,
    });

    const { result } = renderHook(() => useInviteSupporter(), { wrapper: createWrapper() });

    result.current.mutate({
      email: "nonexistent@example.com",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toContain("not found");
    });
  });

  it("should handle other invite errors", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 400,
      ok: false,
    });

    const { result } = renderHook(() => useInviteSupporter(), { wrapper: createWrapper() });

    result.current.mutate({
      email: "supporter@example.com",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useUpdateSupporterStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should accept a supporter invitation", async () => {
    const mockSupporter: Supporter = {
      id: 1,
      memberId: "user-123",
      supporterId: "user-456",
      status: "accepted",
      createdAt: new Date().toISOString(),
    };

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSupporter,
    });

    const { result } = renderHook(() => useUpdateSupporterStatus(), { wrapper: createWrapper() });

    result.current.mutate({
      id: 1,
      status: "accepted",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.status).toBe("accepted");
    });
  });

  it("should reject a supporter invitation", async () => {
    const mockSupporter: Supporter = {
      id: 1,
      memberId: "user-123",
      supporterId: "user-456",
      status: "rejected",
      createdAt: new Date().toISOString(),
    };

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSupporter,
    });

    const { result } = renderHook(() => useUpdateSupporterStatus(), { wrapper: createWrapper() });

    result.current.mutate({
      id: 1,
      status: "rejected",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.status).toBe("rejected");
    });
  });

  it("should handle update errors", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useUpdateSupporterStatus(), { wrapper: createWrapper() });

    result.current.mutate({
      id: 999,
      status: "accepted",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

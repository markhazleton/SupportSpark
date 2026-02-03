import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import type { User } from "@shared/schema";
import React from "react";

// Mock fetch globally
global.fetch = vi.fn();

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

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

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("user query", () => {
    it("should return null when not authenticated (401)", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should return user data when authenticated", async () => {
      const mockUser: User = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed",
        firstName: "Test",
        lastName: "User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle fetch errors", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 500,
        ok: false,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("loginMutation", () => {
    it("should login successfully", async () => {
      const mockUser: User = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed",
        firstName: "Test",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Initial auth check
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock login response
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockUser,
      });

      result.current.loginMutation.mutate({
        email: "test@example.com",
        password: "password123",
      });

      await waitFor(() => {
        expect(result.current.loginMutation.isSuccess).toBe(true);
      });
    });

    it("should handle login errors", async () => {
      // Initial auth check
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock login error
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 401,
        ok: false,
        json: async () => ({ message: "Invalid credentials" }),
      });

      result.current.loginMutation.mutate({
        email: "test@example.com",
        password: "wrongpassword",
      });

      await waitFor(() => {
        expect(result.current.loginMutation.isError).toBe(true);
      });
    });
  });

  describe("registerMutation", () => {
    it("should register successfully", async () => {
      const mockUser: User = {
        id: "user-new",
        email: "new@example.com",
        password: "hashed",
        firstName: "New",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Initial auth check
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock register response
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 201,
        ok: true,
        json: async () => mockUser,
      });

      result.current.registerMutation.mutate({
        email: "new@example.com",
        password: "password123",
        firstName: "New",
      });

      await waitFor(() => {
        expect(result.current.registerMutation.isSuccess).toBe(true);
      });
    });
  });

  describe("logoutMutation", () => {
    it("should logout successfully", async () => {
      // Initial auth check - logged in
      const mockUser: User = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Mock logout response
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ message: "Logged out" }),
      });

      result.current.logoutMutation.mutate();

      await waitFor(() => {
        expect(result.current.logoutMutation.isSuccess).toBe(true);
      });
    });
  });
});

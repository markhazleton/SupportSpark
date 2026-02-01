import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Fetch all conversations (for dashboard/timeline)
export function useConversations() {
  return useQuery({
    queryKey: [api.conversations.list.path],
    queryFn: async () => {
      const res = await fetch(api.conversations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return api.conversations.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch single conversation by ID
export function useConversation(id: number) {
  return useQuery({
    queryKey: [api.conversations.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.conversations.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return api.conversations.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Create a new conversation (Update)
export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.conversations.create.input>) => {
      const res = await fetch(api.conversations.create.path, {
        method: api.conversations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create update");
      return api.conversations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
    },
  });
}

// Add message/reply to conversation
export function useAddMessage(conversationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.conversations.addMessage.input>) => {
      const url = buildUrl(api.conversations.addMessage.path, { id: conversationId });
      const res = await fetch(url, {
        method: api.conversations.addMessage.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add message");
      return api.conversations.addMessage.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.get.path, conversationId] });
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useSupporters() {
  return useQuery({
    queryKey: [api.supporters.list.path],
    queryFn: async () => {
      const res = await fetch(api.supporters.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch supporters");
      return api.supporters.list.responses[200].parse(await res.json());
    },
  });
}

export function useInviteSupporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.supporters.invite.input>) => {
      const res = await fetch(api.supporters.invite.path, {
        method: api.supporters.invite.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("User with that email not found");
        throw new Error("Failed to invite supporter");
      }
      return api.supporters.invite.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.supporters.list.path] });
    },
  });
}

export function useUpdateSupporterStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number } & z.infer<typeof api.supporters.updateStatus.input>) => {
      const url = buildUrl(api.supporters.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.supporters.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.supporters.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.supporters.list.path] });
    },
  });
}

# Development Patterns

> **Long-lasting documentation** for common development patterns in SupportSpark.

## API Development Pattern

### Step 1: Define Schema

```typescript
// shared/schema.ts
import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

export type CreateConversation = z.infer<typeof createConversationSchema>;
```

### Step 2: Define Route Contract

```typescript
// shared/routes.ts
export const routes = {
  createConversation: {
    method: "POST" as const,
    path: "/api/conversations",
    input: createConversationSchema,
    response: ConversationSchema,
    error: errorSchemas.validation,
  },
} as const;
```

### Step 3: Implement Handler

```typescript
// server/routes.ts
app.post("/api/conversations", async (req, res) => {
  const result = createConversationSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.message });
  }

  const conversation = await storage.createConversation(result.data);
  res.status(201).json(conversation);
});
```

### Step 4: Create Test

```typescript
// server/conversations.test.ts
import { describe, it, expect } from "vitest";

describe("POST /api/conversations", () => {
  it("creates a conversation with valid data", async () => {
    const response = await request(app)
      .post("/api/conversations")
      .send({ title: "Test", content: "Content" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });
});
```

## React Component Pattern

### Page Component Structure

```tsx
// client/src/pages/ExamplePage.tsx
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExamplePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/resource"],
    queryFn: fetchResource,
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>{/* Content */}</CardContent>
      </Card>
    </div>
  );
}
```

### Custom Hook Pattern

```typescript
// client/src/hooks/use-resource.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResourceSchema } from "@shared/schema";

export function useResource(id: number) {
  return useQuery({
    queryKey: ["/api/resources", id],
    queryFn: async () => {
      const res = await fetch(`/api/resources/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return ResourceSchema.parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateResource) => {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return ResourceSchema.parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
    },
  });
}
```

## Form Pattern

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createResourceSchema, CreateResource } from "@shared/schema";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ResourceForm({ onSubmit }: { onSubmit: (data: CreateResource) => void }) {
  const form = useForm<CreateResource>({
    resolver: zodResolver(createResourceSchema),
    defaultValues: {
      name: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

## Error Handling Pattern

### Server Side

```typescript
// Standardized error response
interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

// Usage in handlers
try {
  const result = await storage.createResource(data);
  res.status(201).json(result);
} catch (error) {
  if (error instanceof ValidationError) {
    res.status(400).json({ error: error.message, code: "VALIDATION_ERROR" });
  } else {
    res.status(500).json({ error: "Internal server error" });
  }
}
```

### Client Side

```tsx
const mutation = useCreateResource();

const handleSubmit = async (data: CreateResource) => {
  try {
    await mutation.mutateAsync(data);
    toast({ title: "Success", description: "Resource created" });
  } catch (error) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }
};
```

## Testing Patterns

### Component Test

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ResourceForm } from "./ResourceForm";

describe("ResourceForm", () => {
  it("submits valid data", async () => {
    const onSubmit = vi.fn();
    render(<ResourceForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/name/i), "Test");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Test" });
  });
});
```

### Hook Test

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useResource } from "./use-resource";

describe("useResource", () => {
  it("fetches resource data", async () => {
    const { result } = renderHook(() => useResource(1));

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

---

**Last Updated**: 2026-02-01 | **Constitution Reference**: `.documentation/memory/constitution.md`

import { z } from 'zod';
import { insertConversationSchema, insertSupporterSchema, type Conversation, type Supporter } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  conversations: {
    list: {
      method: 'GET' as const,
      path: '/api/conversations',
      responses: {
        200: z.array(z.custom<any>()), // Using custom because of the join/extra fields
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/conversations/:id',
      responses: {
        200: z.custom<Conversation>(),
        404: errorSchemas.notFound,
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/conversations',
      input: z.object({
        title: z.string(),
        initialMessage: z.string(),
      }),
      responses: {
        201: z.custom<Conversation>(),
        400: errorSchemas.validation,
      },
    },
    addMessage: {
      method: 'POST' as const,
      path: '/api/conversations/:id/messages',
      input: z.object({
        content: z.string(),
        parentMessageId: z.string().optional(),
        images: z.array(z.string()).optional(),
      }),
      responses: {
        200: z.custom<Conversation>(), // Returns updated conversation
        404: errorSchemas.notFound,
      },
    },
  },
  supporters: {
    list: {
      method: 'GET' as const,
      path: '/api/supporters',
      responses: {
        200: z.array(z.custom<any>()),
      },
    },
    invite: {
      method: 'POST' as const,
      path: '/api/supporters/invite',
      input: z.object({
        email: z.string().email(),
      }),
      responses: {
        201: z.custom<Supporter>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/supporters/:id/status',
      input: z.object({
        status: z.enum(['accepted', 'rejected']),
      }),
      responses: {
        200: z.custom<Supporter>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

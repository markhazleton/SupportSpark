import type { User as SchemaUser } from "@shared/schema";

// Augment Express namespace to use our schema User type
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends SchemaUser {}
  }
}

import { type Request, type Response, type NextFunction } from 'express';
import { type User } from '@shared/schema';

/**
 * Express Request extended with authenticated Passport user
 * Use this interface for protected routes that require authentication
 */
export interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * Type-safe middleware function
 */
export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Type-safe authenticated middleware
 * For middleware that requires authentication
 */
export type AuthMiddleware = Middleware;

/**
 * Type-safe authenticated route handler
 * Guarantees req.user is available and properly typed
 */
export type AuthHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

/**
 * Type-safe standard route handler
 */
export type RouteHandler = (
  req: Request,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

/**
 * Type-safe error handler
 */
export type ErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => void;

import type { Express } from "express";
import { promises as fs } from "fs";
import path from "path";
import multer from "multer";

import type { IStorage } from "./storage";
import type { AuthenticatedRequest, AuthMiddleware } from "./types";

export function registerConversationImageRoutes(
  app: Express,
  storage: IStorage,
  requireAuth: AuthMiddleware
): void {
  const imageStorage = multer.diskStorage({
    destination: async (req, _file, cb) => {
      const conversationId = req.params.id;
      const uploadDir = path.join(
        process.cwd(),
        "data",
        "conversations",
        `conv-${conversationId}`,
        "images"
      );

      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (err) {
        cb(err as Error, uploadDir);
      }
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });

  const imageUpload = multer({
    storage: imageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const ext = path.extname(file.originalname).toLowerCase();

      if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
      }
    },
  });

  const verifyMemberOwnership: AuthMiddleware = async (req: AuthenticatedRequest, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const id = Number(req.params.id);
    const conversation = await storage.getConversation(id);

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    if (conversation.memberId !== userId) {
      res.status(403).json({ message: "Only the member can upload images" });
      return;
    }

    next();
  };

  app.post(
    "/api/conversations/:id/images",
    requireAuth,
    verifyMemberOwnership,
    imageUpload.array("images", 5),
    async (req: AuthenticatedRequest, res) => {
      const id = Number(req.params.id);
      const files = req.files as Express.Multer.File[];
      const imageUrls = files.map((file) => `/api/conversations/${id}/images/${file.filename}`);

      res.json({ images: imageUrls });
    }
  );

  app.get("/api/conversations/:id/images/:filename", async (req, res) => {
    const { id, filename } = req.params;
    const imagePath = path.join(
      process.cwd(),
      "data",
      "conversations",
      `conv-${id}`,
      "images",
      filename
    );

    try {
      await fs.access(imagePath);
      res.sendFile(imagePath);
    } catch {
      res.status(404).json({ message: "Image not found" });
    }
  });
}

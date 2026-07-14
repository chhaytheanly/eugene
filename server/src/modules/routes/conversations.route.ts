import { Router, type Request, type Response } from "express";
import {
  createConversation,
  getConversation,
  listConversations,
  addMessage,
  deleteConversation,
} from "../services/conversations.service";

const router = Router();

router.get("/conversations", async (_req: Request, res: Response) => {
  const conversations = await listConversations();
  res.json(conversations);
});

router.get("/conversations/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const conversation = await getConversation(id);
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json(conversation);
});

router.post("/conversations", async (req: Request, res: Response) => {
  const { modelUsed } = req.body;
  const conversation = await createConversation(modelUsed || "gpt-4o");
  res.status(201).json(conversation);
});

router.post("/conversations/:id/messages", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { role, content } = req.body;
  if (!role || !content) {
    res.status(400).json({ error: "role and content are required" });
    return;
  }
  const conversation = await addMessage(id, { role, content });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json(conversation);
});

router.delete("/conversations/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await deleteConversation(id);
  res.status(204).end();
});

export default router;

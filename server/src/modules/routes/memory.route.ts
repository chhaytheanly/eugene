import { Router, type Request, type Response } from "express";
import { createMemory, listMemories, deleteMemory } from "../services/memory.service";

const router = Router();

router.get("/memory", async (_req: Request, res: Response) => {
  const memories = await listMemories();
  res.json(memories);
});

router.post("/memory", async (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: "content is required" });
    return;
  }
  const memory = await createMemory(content);
  res.status(201).json(memory);
});

router.delete("/memory/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await deleteMemory(id);
  res.status(204).end();
});

export default router;

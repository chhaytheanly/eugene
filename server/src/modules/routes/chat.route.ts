import { Router, type Request, type Response } from "express";
import { chat } from "../services/chat.service";
import type { ModelProvider } from "../services/models.service";

const router = Router();

router.post("/chat", async (req: Request, res: Response) => {
  const { message, conversationId, model, provider } = req.body;

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  try {
    const result = await chat(
      message,
      conversationId,
      model,
      provider as ModelProvider | undefined
    );
    res.json(result);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "An error occurred while processing your message." });
  }
});

export default router;

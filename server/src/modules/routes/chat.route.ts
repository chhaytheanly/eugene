import { Router, type Request, type Response } from "express";
import { chat, chatStream } from "../services/chat.service";
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

router.post("/chat/stream", async (req: Request, res: Response) => {
  const { message, conversationId, model, provider } = req.body;

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const emit = (event: string, data: any) => {
    res.write(`data: ${JSON.stringify({ type: event, ...data })}\n\n`);
  };

  try {
    await chatStream(
      message,
      conversationId,
      model,
      provider as ModelProvider | undefined,
      emit
    );
  } catch (error) {
    console.error("Chat stream error:", error);
    emit("error", { error: "An error occurred during streaming." });
  } finally {
    res.end();
  }
});

export default router;

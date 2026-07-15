import { Router, type Request, type Response } from "express";
import { getAvailableModels } from "../services/models.service";

const router = Router();

router.get("/models", async (_req: Request, res: Response) => {
  try {
    const models = await getAvailableModels();
    res.json({ models });
  } catch (error) {
    console.error("Models error:", error);
    res.status(500).json({ error: "Failed to load models." });
  }
});

export default router;

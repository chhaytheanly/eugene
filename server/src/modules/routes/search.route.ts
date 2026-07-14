import { Router, type Request, type Response } from "express";
import { searchMemory, searchNote } from "../services/search.service";

const router = Router();

router.get("/search", async (req: Request, res: Response) => {
  const query = req.query.q as string | undefined;
  const limit = parseInt(req.query.limit as string) || 5;

  if (!query) {
    res.status(400).json({ error: 'Query parameter "q" is required.' });
    return;
  }

  try {
    const results = await searchNote(query, limit);
    res.json(results);
  } catch (error) {
    console.error("Error searching notes:", error);
    res.status(500).json({ error: "An error occurred while searching notes." });
  }
});

router.get("/search/memory", async (req: Request, res: Response) => {
  const query = req.query.q as string | undefined;
  const limit = parseInt(req.query.limit as string) || 5;

  if (!query) {
    res.status(400).json({ error: 'Query parameter "q" is required.' });
    return;
  }

  try {
    const results = await searchMemory(query, limit);
    res.json(results);
  } catch (error) {
    console.error("Error searching memory:", error);
    res.status(500).json({ error: "An error occurred while searching memory." });
  }
});

export default router;  
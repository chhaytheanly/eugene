import { Router, type Request, type Response } from "express";
import {
  createNote,
  getNote,
  listNotes,
  updateNote,
  deleteNote,
} from "../services/notes.service";

const router = Router();

router.get("/notes", async (_req: Request, res: Response) => {
  const notes = await listNotes();
  res.json(notes);
});

router.get("/notes/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const note = await getNote(id);
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json(note);
});

router.post("/notes", async (req: Request, res: Response) => {
  const { title, content } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: "title and content are required" });
    return;
  }
  const note = await createNote(title, content);
  res.status(201).json(note);
});

router.put("/notes/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const note = await updateNote(id, req.body);
  res.json(note);
});

router.delete("/notes/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await deleteNote(id);
  res.status(204).end();
});

export default router;

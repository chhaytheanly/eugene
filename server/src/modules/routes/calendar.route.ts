import { Router, type Request, type Response } from "express";
import {
  createEvent,
  getEvent,
  listEvents,
  updateEvent,
  deleteEvent,
} from "../services/calendar.service";

const router = Router();

router.get("/calendar", async (req: Request, res: Response) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const events = await listEvents(from, to);
  res.json(events);
});

router.get("/calendar/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const event = await getEvent(id);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(event);
});

router.post("/calendar", async (req: Request, res: Response) => {
  const { title, start, end } = req.body;
  if (!title || !start || !end) {
    res.status(400).json({ error: "title, start, and end are required" });
    return;
  }
  const event = await createEvent(req.body);
  res.status(201).json(event);
});

router.put("/calendar/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const event = await updateEvent(id, req.body);
  res.json(event);
});

router.delete("/calendar/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await deleteEvent(id);
  res.status(204).end();
});

export default router;

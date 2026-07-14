import { Router, type Request, type Response } from "express";
import {
  createTask,
  getTask,
  listTasks,
  updateTask,
  deleteTask,
} from "../services/tasks.service";

const router = Router();

router.get("/tasks", async (req: Request, res: Response) => {
  const completed = req.query.completed !== undefined ? req.query.completed === "true" : undefined;
  const priority = req.query.priority ? parseInt(req.query.priority as string) : undefined;
  const tasks = await listTasks({ completed, priority });
  res.json(tasks);
});

router.get("/tasks/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const task = await getTask(id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

router.post("/tasks", async (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const task = await createTask(req.body);
  res.status(201).json(task);
});

router.put("/tasks/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const task = await updateTask(id, req.body);
  res.json(task);
});

router.delete("/tasks/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await deleteTask(id);
  res.status(204).end();
});

export default router;

import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma, enableVectorExtension } from "./src/database/prisma";
import searchRouter from "./src/modules/routes/search.route";
import notesRouter from "./src/modules/routes/notes.route";
import tasksRouter from "./src/modules/routes/tasks.route";
import calendarRouter from "./src/modules/routes/calendar.route";
import memoryRouter from "./src/modules/routes/memory.route";
import conversationsRouter from "./src/modules/routes/conversations.route";
import chatRouter from "./src/modules/routes/chat.route";
import modelsRouter from "./src/modules/routes/models.route";

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

app.use(cors());
app.use(express.json());

app.use(searchRouter);
app.use(notesRouter);
app.use(tasksRouter);
app.use(calendarRouter);
app.use(memoryRouter);
app.use(conversationsRouter);
app.use(chatRouter);
app.use(modelsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function main() {
  try {
    await enableVectorExtension();
    console.log("Vector extension enabled");

    await prisma.$connect();
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();

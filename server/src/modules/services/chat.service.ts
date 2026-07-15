import { readFileSync } from "fs";
import { join } from "path";
import OpenAI from "openai";
import { prisma } from "../../database/prisma";
import { getEmbedding } from "./embedding/embedding";
import * as notesService from "./notes.service";
import * as tasksService from "./tasks.service";
import * as calendarService from "./calendar.service";
import * as memoryService from "./memory.service";
import * as searchService from "./search.service";
import { webSearch, webFetch } from "./tools/web.service";
import { buildClient, defaultProvider, defaultModel, type ModelProvider } from "./models.service";

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
};

type ToolResult = {
  role: "tool";
  tool_call_id: string;
  content: string;
};

let systemPrompt: string | null = null;

function getSystemPrompt(): string {
  if (!systemPrompt) {
    try {
      systemPrompt = readFileSync(join(import.meta.dir, "../../../README.md"), "utf-8");
    } catch {
      systemPrompt = "You are a personal AI work assistant.";
    }
  }
  return systemPrompt;
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchNote",
      description: "Search notes semantically by similarity to a query",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          limit: { type: "number", description: "Max results (default 5)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchMemory",
      description: "Search long-term memory entries semantically",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          limit: { type: "number", description: "Max results (default 5)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createNote",
      description: "Create a new note with markdown content",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Note title" },
          content: { type: "string", description: "Note content in markdown" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listNotes",
      description: "List all notes, most recent first",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "createTask",
      description: "Create a new task",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Optional description" },
          dueDate: { type: "string", description: "ISO date string (optional)" },
          priority: { type: "number", description: "0=low, 1=medium, 2=high (default 0)" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listTasks",
      description: "List tasks, optionally filtered",
      parameters: {
        type: "object",
        properties: {
          completed: { type: "boolean", description: "Filter by completion status" },
          priority: { type: "number", description: "Filter by priority (0-2)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateTask",
      description: "Update a task's fields",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Task ID" },
          title: { type: "string" },
          description: { type: "string" },
          completed: { type: "boolean" },
          priority: { type: "number" },
          dueDate: { type: "string", description: "ISO date string" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listCalendarEvents",
      description: "List calendar events, optionally filtered by date range",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "ISO date string for start of range" },
          to: { type: "string", description: "ISO date string for end of range" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createCalendarEvent",
      description: "Create a new calendar event",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          start: { type: "string", description: "ISO date string for start" },
          end: { type: "string", description: "ISO date string for end" },
          notes: { type: "string", description: "Optional notes" },
          allDay: { type: "boolean", description: "Whether it's an all-day event" },
        },
        required: ["title", "start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createMemory",
      description: "Save an important fact or memory for future reference",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "The fact or memory to save" },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "webSearch",
      description: "Search the web for current information",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Web search query" },
          limit: { type: "number", description: "Max results (default 5)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "webFetch",
      description: "Fetch and read the content of a web page",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to fetch" },
        },
        required: ["url"],
      },
    },
  },
];

type FunctionToolCall = Extract<OpenAI.Chat.Completions.ChatCompletionMessageToolCall, { type: "function" }>;

async function executeToolCall(toolCall: FunctionToolCall): Promise<string> {
  const args = JSON.parse(toolCall.function.arguments || "{}");

  switch (toolCall.function.name) {
    case "searchNote": {
      const results = await searchService.searchNote(args.query, args.limit ?? 5);
      return JSON.stringify(results);
    }
    case "searchMemory": {
      const results = await searchService.searchMemory(args.query, args.limit ?? 5);
      return JSON.stringify(results);
    }
    case "createNote": {
      const note = await notesService.createNote(args.title, args.content);
      return JSON.stringify(note);
    }
    case "listNotes": {
      const notes = await notesService.listNotes();
      return JSON.stringify(notes);
    }
    case "createTask": {
      const task = await tasksService.createTask(args);
      return JSON.stringify(task);
    }
    case "listTasks": {
      const tasks = await tasksService.listTasks({
        completed: args.completed,
        priority: args.priority,
      });
      return JSON.stringify(tasks);
    }
    case "updateTask": {
      const { id, ...data } = args;
      const task = await tasksService.updateTask(id, data);
      return JSON.stringify(task);
    }
    case "listCalendarEvents": {
      const events = await calendarService.listEvents(args.from, args.to);
      return JSON.stringify(events);
    }
    case "createCalendarEvent": {
      const event = await calendarService.createEvent(args);
      return JSON.stringify(event);
    }
    case "createMemory": {
      const memory = await memoryService.createMemory(args.content);
      return JSON.stringify(memory);
    }
    case "webSearch": {
      const results = await webSearch(args.query, args.limit ?? 5);
      return JSON.stringify(results);
    }
    case "webFetch": {
      const result = await webFetch(args.url);
      return JSON.stringify(result);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolCall.function.name}` });
  }
}

export type ChatResponse = {
  conversationId: string;
  reply: string;
};

export async function chat(
  message: string,
  conversationId?: string,
  model?: string,
  provider?: ModelProvider
): Promise<ChatResponse> {
  const client = buildClient(provider);
  const resolvedProvider = provider ?? defaultProvider();
  const resolvedModel = model || defaultModel(resolvedProvider);

  const systemContent = getSystemPrompt();

  let existingMessages: ChatMessage[] = [];

  if (conversationId) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (conversation) {
      existingMessages = (conversation.messages as ChatMessage[])?.filter(
        (m) => m.role !== "system"
      ) ?? [];
    } else {
      const conv = await prisma.conversation.create({
        data: { messages: [], modelUsed: resolvedModel },
      });
      conversationId = conv.id;
    }
  } else {
    const conv = await prisma.conversation.create({
      data: { messages: [], modelUsed: resolvedModel },
    });
    conversationId = conv.id;
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...existingMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const response = await client.chat.completions.create({
    model: resolvedModel,
    messages,
    tools,
    tool_choice: "auto",
  });

  const choice = response.choices[0]!;
  const replyMessage = choice.message;

  const toolResults: ToolResult[] = [];

  if (replyMessage.tool_calls) {
    for (const toolCall of replyMessage.tool_calls) {
      if (toolCall.type !== "function") continue;
      const result = await executeToolCall(toolCall);
      toolResults.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    const followUpMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemContent },
      ...existingMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
      replyMessage as OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam,
      ...toolResults,
    ];

    const followUp = await client.chat.completions.create({
      model: resolvedModel,
      messages: followUpMessages,
    });

    const finalReply = followUp.choices[0]!.message.content || "";

    const allMessages: ChatMessage[] = [
      ...existingMessages,
      { role: "user", content: message },
      { role: "assistant", content: finalReply },
    ];

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { messages: allMessages },
    });

    return { conversationId, reply: finalReply };
  }

  const reply = replyMessage.content || "";
  const allMessages: ChatMessage[] = [
    ...existingMessages,
    { role: "user", content: message },
    { role: "assistant", content: reply },
  ];

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { messages: allMessages },
  });

  return { conversationId, reply };
}

export async function chatStream(
  message: string,
  conversationId: string | undefined,
  model: string | undefined,
  provider: ModelProvider | undefined,
  emit: (event: string, data: any) => void
): Promise<void> {
  const client = buildClient(provider);
  const resolvedProvider = provider ?? defaultProvider();
  const resolvedModel = model || defaultModel(resolvedProvider);
  const systemContent = getSystemPrompt();
  let existingMessages: ChatMessage[] = [];

  if (conversationId) {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (conversation) {
      existingMessages = (conversation.messages as ChatMessage[])?.filter(m => m.role !== "system") ?? [];
    } else {
      const conv = await prisma.conversation.create({ data: { messages: [], modelUsed: resolvedModel } });
      conversationId = conv.id;
    }
  } else {
    const conv = await prisma.conversation.create({ data: { messages: [], modelUsed: resolvedModel } });
    conversationId = conv.id;
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...existingMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  try {
    const abortController = new AbortController();
    let dupCount = 0;
    const response = await client.chat.completions.create({
      model: resolvedModel,
      messages,
      tools,
      tool_choice: "auto",
      stream: true,
    }, { signal: abortController.signal });

    let assistantContent = "";
    let lastToken = "";
    const toolCallsMap = new Map<number, { id: string; type: "function"; function: { name: string; arguments: string } }>();

    try {
    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        const piece = delta.content;
        if (piece !== lastToken) {
          assistantContent += piece;
          emit("token", { value: piece });
          lastToken = piece;
        } else {
          // provider is emitting each token twice; skip it
          dupCount++;
          if (dupCount >= 2) abortController.abort();
        }
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCallsMap.has(tc.index)) {
            toolCallsMap.set(tc.index, { id: tc.id || "", type: "function", function: { name: tc.function?.name || "", arguments: "" } });
          }
          const existing = toolCallsMap.get(tc.index)!;
          if (tc.function?.arguments) {
            existing.function.arguments += tc.function.arguments;
          }
        }
      }
    }
    } catch (err: any) {
      if (err?.name !== "AbortError") throw err;
    }

    if (toolCallsMap.size > 0) {
      const toolCalls = Array.from(toolCallsMap.values());
      const toolResults: ToolResult[] = [];

      for (const tc of toolCalls) {
        emit("tool", { name: tc.function.name });
        // cast to FunctionToolCall for executeToolCall
        const result = await executeToolCall(tc as any);
        toolResults.push({ role: "tool", tool_call_id: tc.id, content: result });
      }

      const followUpMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        ...messages,
        { role: "assistant", content: assistantContent, tool_calls: toolCalls },
        ...toolResults,
      ];

      const followUpAbort = new AbortController();
      const followUp = await client.chat.completions.create({
        model: resolvedModel,
        messages: followUpMessages,
        stream: true,
      }, { signal: followUpAbort.signal });

      try {
      for await (const chunk of followUp) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          const piece = delta.content;
          if (piece !== lastToken) {
            assistantContent += piece;
            emit("token", { value: piece });
            lastToken = piece;
          } else {
            dupCount++;
            if (dupCount >= 2) followUpAbort.abort();
          }
        }
      }
      } catch (err: any) {
        if (err?.name !== "AbortError") throw err;
      }
    }

    const allMessages: ChatMessage[] = [
      ...existingMessages,
      { role: "user", content: message },
      { role: "assistant", content: assistantContent },
    ];

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { messages: allMessages },
    });

    emit("done", { conversationId });
  } catch (error: any) {
    console.error("Stream error:", error);
    emit("error", { error: error.message || "Unknown error" });
  }
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  priority: 0 | 1 | 2;
  dueDate?: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  notes?: string;
  allDay?: boolean;
  createdAt?: string;
}

export interface Memory {
  id: string;
  content: string;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  conversationId?: string;
  messages: ChatMessage[];
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: "openai" | "openrouter" | "opencode" | "gemini";
  description?: string;
  contextLength?: number;
}

export type TaskPriority = 0 | 1 | 2;

export interface TaskCreatePayload {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority;
  completed?: boolean;
}

export interface NoteCreatePayload {
  title: string;
  content: string;
}

export interface EventCreatePayload {
  title: string;
  start: string;
  end: string;
  notes?: string;
  allDay?: boolean;
}

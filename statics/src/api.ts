import axios from 'axios';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:6868';

const api = axios.create({
  baseURL: baseUrl,
});

// Chat
export type ModelInfo = {
  id: string;
  name: string;
  provider: "openai" | "openrouter" | "opencode" | "gemini";
  description?: string;
  contextLength?: number;
};

export const sendMessage = async (
  message: string,
  conversationId?: string,
  model?: string,
  provider?: string
) => {
  const { data } = await api.post('/chat', { message, conversationId, model, provider });
  return data;
};

export const streamChat = async (
  message: string,
  conversationId: string | undefined,
  model: string | undefined,
  provider: string | undefined,
  handlers: {
    signal?: AbortSignal;
    onToken: (token: string) => void;
    onTool?: (name: string) => void;
    onDone: (convId: string) => void;
    onError: (err: string) => void;
  }
) => {
  try {
    const res = await fetch(`${baseUrl}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationId, model, provider }),
      signal: handlers.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    if (!res.body) throw new Error("No response body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in buffer

      for (const line of lines) {
        if (line.trim() === "") continue;
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "token") {
              handlers.onToken(data.value);
            } else if (data.type === "tool") {
              handlers.onTool?.(data.name);
            } else if (data.type === "done") {
              handlers.onDone(data.conversationId);
            } else if (data.type === "error") {
              handlers.onError(data.error);
            }
          } catch {
            console.error("Failed to parse SSE line", line);
          }
        }
      }
    }
  } catch (err: any) {
    handlers.onError(err.message || "Failed to stream chat");
  }
};

export const getModels = async (): Promise<ModelInfo[]> =>
  (await api.get('/models')).data.models;

// Notes
export const getNotes = async () => (await api.get('/notes')).data;
export const createNote = async (payload: { title: string; content: string }) => (await api.post('/notes', payload)).data;
export const deleteNote = async (id: string) => await api.delete(`/notes/${id}`);

// Tasks
export const getTasks = async (completed?: boolean) => {
  const params = completed !== undefined ? { completed } : {};
  return (await api.get('/tasks', { params })).data;
};
export const createTask = async (payload: { title: string; description?: string; dueDate?: string; priority?: number }) => (await api.post('/tasks', payload)).data;
export const updateTask = async (id: string, payload: any) => (await api.put(`/tasks/${id}`, payload)).data;
export const deleteTask = async (id: string) => await api.delete(`/tasks/${id}`);

// Memory
export const getMemories = async () => (await api.get('/memory')).data;
export const createMemory = async (payload: { content: string }) => (await api.post('/memory', payload)).data;
export const deleteMemory = async (id: string) => await api.delete(`/memory/${id}`);

// Calendar
export const getEvents = async () => (await api.get('/calendar')).data;
export const createEvent = async (payload: { title: string; start: string; end: string; notes?: string; allDay?: boolean }) => (await api.post('/calendar', payload)).data;
export const updateEvent = async (id: string, payload: { title?: string; start?: string; end?: string; notes?: string; allDay?: boolean }) => (await api.put(`/calendar/${id}`, payload)).data;
export const deleteEvent = async (id: string) => await api.delete(`/calendar/${id}`);

export default api;

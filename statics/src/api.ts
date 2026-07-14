import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Chat
export const sendMessage = async (message: string, conversationId?: string) => {
  const { data } = await api.post('/chat', { message, conversationId });
  return data;
};

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
export const deleteEvent = async (id: string) => await api.delete(`/calendar/${id}`);

export default api;

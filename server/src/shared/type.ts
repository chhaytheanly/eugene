export interface NoteSearchResult {
    id: string;
    title: string;
    content: string;
    similarity: number;
}

export interface MemorySearchResult {
    id: string;
    content: string;
    similarity: number;
}
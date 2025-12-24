import { nextServer } from "./api";

import type { Note } from "@/types/note";
import type { User } from "@/types/user";

// -------- TYPES (локально, як в ТЗ) --------
export type NotesResponse = {
  notes: Note[];
  page: number;
  perPage: number;
  totalPages: number;
};

export type FetchNotesParams = {
  search?: string;
  page?: number;
  perPage?: 12; // завжди 12
  tag?: string;
};

export type CreateNotePayload = Pick<Note, "title" | "content" | "tag">;

export type AuthBody = {
  email: string;
  password: string;
};

// -------- AUTH --------
export async function register(body: AuthBody) {
  const { data } = await nextServer.post<User>("/auth/register", body);
  return data;
}

export async function login(body: AuthBody) {
  const { data } = await nextServer.post<User>("/auth/login", body);
  return data;
}

export async function logout() {
  await nextServer.post("/auth/logout");
}

// ⚠️ тільки перевірка сесії (user або null)
export async function checkSession() {
  const { data } = await nextServer.get<User | null>("/auth/session");
  return data;
}

// -------- USERS --------
export async function getMe() {
  const { data } = await nextServer.get<User>("/users/me");
  return data;
}

export async function updateMe(payload: Partial<Pick<User, "username">>) {
  const { data } = await nextServer.patch<User>("/users/me", payload);
  return data;
}

// -------- NOTES --------
export async function fetchNotes(params: FetchNotesParams) {
  const { data } = await nextServer.get<NotesResponse>("/notes", {
    params: { perPage: 12, ...params },
  });
  return data;
}

export async function fetchNoteById(id: string) {
  const { data } = await nextServer.get<Note>(`/notes/${id}`);
  return data;
}

export async function createNote(noteData: CreateNotePayload) {
  const { data } = await nextServer.post<Note>("/notes", noteData);
  return data;
}

export async function deleteNote(id: string) {
  const { data } = await nextServer.delete<Note>(`/notes/${id}`);
  return data;
}

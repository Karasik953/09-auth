import { cookies } from "next/headers";
import { api } from "./api";

import type { Note } from "@/types/note";
import type { User } from "@/types/user";
import type { FetchNotesParams, NotesResponse } from "./clientApi";

async function cookieHeader() {
  // У твоїй версії Next це Promise, тому await
  const store = await cookies();

  const accessToken = store.get("accessToken")?.value;
  const refreshToken = store.get("refreshToken")?.value;

  const parts: string[] = [];
  if (accessToken) parts.push(`accessToken=${accessToken}`);
  if (refreshToken) parts.push(`refreshToken=${refreshToken}`);

  return parts.join("; ");
}

// ✅ тільки те, що треба в ТЗ для serverApi:
export async function fetchNotesServer(params: FetchNotesParams) {
  const cookie = await cookieHeader();

  const { data } = await api.get<NotesResponse>("/notes", {
    params: { perPage: 12, ...params },
    headers: cookie ? { Cookie: cookie } : undefined,
  });

  return data;
}

export async function fetchNoteByIdServer(id: string) {
  const cookie = await cookieHeader();

  const { data } = await api.get<Note>(`/notes/${id}`, {
    headers: cookie ? { Cookie: cookie } : undefined,
  });

  return data;
}

export async function getMeServer() {
  const cookie = await cookieHeader();

  const { data } = await api.get<User>("/users/me", {
    headers: cookie ? { Cookie: cookie } : undefined,
  });

  return data;
}

export async function checkSessionServer() {
  const cookie = await cookieHeader();

  const { data } = await api.get<User | null>("/auth/session", {
    headers: cookie ? { Cookie: cookie } : undefined,
  });

  return data;
}

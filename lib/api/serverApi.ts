import { cookies } from "next/headers";
import type { AxiosResponse } from "axios";

import { nextServer } from "./api";

import type { Note } from "@/types/note";
import type { User } from "@/types/user";
import type { FetchNotesParams, NotesResponse } from "./clientApi";

async function cookieHeader() {
  const store = await cookies();

  const accessToken = store.get("accessToken")?.value;
  const refreshToken = store.get("refreshToken")?.value;

  const parts: string[] = [];
  if (accessToken) parts.push(`accessToken=${accessToken}`);
  if (refreshToken) parts.push(`refreshToken=${refreshToken}`);

  return parts.join("; ");
}

export async function fetchNotesServer(params: FetchNotesParams) {
  const cookie = await cookieHeader();

  const { data } = await nextServer.get<NotesResponse>("/notes", {
    params: { perPage: 12, ...params },
    headers: cookie ? { Cookie: cookie } : undefined,
  });

  return data;
}

export async function fetchNoteByIdServer(id: string) {
  const cookie = await cookieHeader();

  const { data } = await nextServer.get<Note>(`/notes/${id}`, {
    headers: cookie ? { Cookie: cookie } : undefined,
  });

  return data;
}

export async function getMeServer() {
  const cookie = await cookieHeader();

  const { data } = await nextServer.get<User>("/users/me", {
    headers: cookie ? { Cookie: cookie } : undefined,
  });

  return data;
}

// ✅ ВАЖЛИВО: повертаємо ПОВНИЙ AxiosResponse
export async function checkSessionServer(): Promise<AxiosResponse<User | null>> {
  const cookie = await cookieHeader();

  const res = await nextServer.get<User | null>("/auth/session", {
    headers: cookie ? { Cookie: cookie } : undefined,
    validateStatus: () => true,
  });

  return res;
}

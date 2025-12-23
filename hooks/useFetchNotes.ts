// src/hooks/useFetchNotes.ts
import { useQuery } from "@tanstack/react-query";
import { fetchNotes, type NotesResponse } from "../lib/api/clientApi";

export const useFetchNotes = (searchQuery: string, page: number) => {
  return useQuery<NotesResponse>({
    queryKey: ["notes", { search: searchQuery, page }],
    queryFn: () => fetchNotes({ search: searchQuery, page, perPage: 12 }),
  });
};

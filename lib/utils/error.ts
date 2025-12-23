import { isAxiosError } from "axios";

export function getErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    return (
      (err.response?.data as any)?.message ||
      (err.response?.data as any)?.error ||
      err.message
    );
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

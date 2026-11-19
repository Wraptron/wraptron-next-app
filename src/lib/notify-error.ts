/** Single error notification helper — matches existing task UI (`alert`). */
export function notifyError(message: string): void {
  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

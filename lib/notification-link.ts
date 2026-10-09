/** Permit internal paths and HTTPS destinations, never protocol-relative URLs. */
export function validNotificationLink(value: string) {
  if (!value) return true;
  if (/[\s\\]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

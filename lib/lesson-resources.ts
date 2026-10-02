export interface LessonResource {
  title: string;
  url: string;
}
/** Supports stored JSON and arrays while excluding script/data URLs. */
export function lessonResources(value: unknown): LessonResource[] {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const title = item.title ?? item.name;
    const url = item.url ?? item.href;
    if (typeof title !== "string" || !title.trim() || typeof url !== "string")
      return [];
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return [];
    } catch {
      return [];
    }
    return [{ title: title.trim().slice(0, 200), url }];
  });
}

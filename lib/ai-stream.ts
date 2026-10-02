/** Incremental SSE framing shared by provider and browser streams. */
export class SseDecoder {
  private decoder = new TextDecoder();
  private buffer = "";
  push(chunk: Uint8Array): string[] {
    this.buffer += this.decoder.decode(chunk, { stream: true });
    return this.frames(false);
  }
  finish(): string[] {
    this.buffer += this.decoder.decode();
    return this.frames(true);
  }
  private frames(final: boolean): string[] {
    const events: string[] = [];
    // Keep a trailing CR until the next chunk, which may contain its LF.
    this.buffer = this.buffer.replace(/\r\n/g, "\n");
    let boundary: number;
    while ((boundary = this.buffer.indexOf("\n\n")) !== -1) {
      const frame = this.buffer.slice(0, boundary);
      this.buffer = this.buffer.slice(boundary + 2);
      const data = this.data(frame);
      if (data !== null) events.push(data);
    }
    if (final && this.buffer.trim()) {
      const data = this.data(this.buffer);
      if (data !== null) events.push(data);
      this.buffer = "";
    }
    return events;
  }
  private data(frame: string): string | null {
    const lines = frame.split("\n").filter((line) => line.startsWith("data:"));
    return lines.length
      ? lines.map((line) => line.slice(5).replace(/^ /, "")).join("\n")
      : null;
  }
}

export function providerText(
  data: string,
  provider: "gemini" | "groq",
): string {
  const parsed = JSON.parse(data);
  if (parsed.error)
    throw new Error("El proveedor no pudo completar la respuesta.");
  if (provider === "groq") {
    const text = parsed.choices?.[0]?.delta?.content;
    return typeof text === "string" ? text : "";
  }
  return (parsed.candidates?.[0]?.content?.parts ?? [])
    .filter(
      (part: { text?: string; thought?: boolean }) =>
        !part.thought && typeof part.text === "string",
    )
    .map((part: { text: string }) => part.text)
    .join("");
}

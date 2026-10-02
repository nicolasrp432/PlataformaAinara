import type { ReactNode } from "react";
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : part.startsWith("`") && part.endsWith("`") ? (
      <code key={index} className="rounded bg-muted px-1 text-[.9em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}
/** Small, safe text renderer: content stays React text, never injected HTML. */
export function RichText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div className={`rich-text ${className}`}>
      {text.split(/\n\s*\n/).map((block, index) => {
        const lines = block.split("\n");
        if (lines.every((line) => /^\s*[-•*]\s/.test(line)))
          return (
            <ul key={index}>
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\s*[-•*]\s/, ""))}</li>
              ))}
            </ul>
          );
        if (lines.every((line) => /^\s*\d+[.)]\s/.test(line)))
          return (
            <ol key={index}>
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\s*\d+[.)]\s/, ""))}</li>
              ))}
            </ol>
          );
        if (/^#{1,3} /.test(block))
          return <h3 key={index}>{inline(block.replace(/^#{1,3} /, ""))}</h3>;
        return (
          <p key={index}>
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {inline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

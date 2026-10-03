import type { ReactNode } from "react"

function inline(text: string): ReactNode[] {
  return text
    .split(/(\\*\\*[^*]+\\*\\*|\\*[^*]+\\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={index}>{part.slice(1, -1)}</em>
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[.9em] text-foreground">
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
}

/** Markdown ligero y seguro: nunca inyecta HTML. */
export function RichText({
  text,
  className = "",
}: {
  text: string
  className?: string
}) {
  return (
    <div className={`rich-text space-y-3 ${className}`}>
      {text.split(/\\n\\s*\\n/).map((block, index) => {
        const lines = block.split("\\n")

        if (lines.every((line) => /^\\s*[-•*]\\s/.test(line))) {
          return (
            <ul key={index} className="ml-5 list-disc space-y-1">
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\\s*[-•*]\\s/, ""))}</li>
              ))}
            </ul>
          )
        }

        if (lines.every((line) => /^\\s*\\d+[.)]\\s/.test(line))) {
          return (
            <ol key={index} className="ml-5 list-decimal space-y-1">
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\\s*\\d+[.)]\\s/, ""))}</li>
              ))}
            </ol>
          )
        }

        const heading = block.match(/^(#{1,3})\\s+([\\s\\S]+)$/)
        if (heading) {
          const level = heading[1].length
          const content = inline(heading[2])
          if (level === 1) {
            return <h1 key={index} className="font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">{content}</h1>
          }
          if (level === 2) {
            return <h2 key={index} className="font-display text-xl font-semibold leading-tight text-foreground sm:text-2xl">{content}</h2>
          }
          return <h3 key={index} className="text-base font-semibold leading-snug text-foreground sm:text-lg">{content}</h3>
        }

        return (
          <p key={index} className="leading-relaxed">
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {inline(line)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

import type { ReactNode } from "react";
/** Shared hierarchy across learning, community and personal tools. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="ainara-page-header workspace-header">
      <div>
        <p className="ainara-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="workspace-description">{description}</p>}
      </div>
      {actions && <div className="workspace-header-actions">{actions}</div>}
    </header>
  );
}

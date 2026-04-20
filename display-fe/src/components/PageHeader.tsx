import * as React from "react";

export function PageHeader({
  title,
  description,
  actions,
  action,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const resolvedActions = actions ?? action;
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
        ) : null}
      </div>
      {resolvedActions ? <div className="shrink-0">{resolvedActions}</div> : null}
    </div>
  );
}

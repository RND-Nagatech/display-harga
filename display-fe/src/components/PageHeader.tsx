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
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-foreground md:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {resolvedActions ? <div className="shrink-0 pt-1">{resolvedActions}</div> : null}
    </div>
  );
}

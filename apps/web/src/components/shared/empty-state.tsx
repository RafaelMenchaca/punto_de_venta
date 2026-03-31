import { PackageSearch } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border bg-white/58 p-7 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/80">
        <PackageSearch className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: Array<{ id: T; label: string; helper?: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 rounded-[1.4rem] border border-white/70 bg-white/78 p-2 shadow-[0_14px_34px_rgba(23,23,23,0.05)] backdrop-blur-sm",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === value;

        return (
          <Button
            key={item.id}
            type="button"
            variant={active ? "default" : "outline"}
            className={cn(
              "min-h-11 rounded-xl px-4 py-3",
              active
                ? "shadow-[0_12px_24px_rgba(15,118,110,0.18)]"
                : "border-transparent bg-transparent hover:border-border hover:bg-white",
            )}
            onClick={() => onChange(item.id)}
          >
            <span className="flex flex-col items-start text-left leading-none">
              <span>{item.label}</span>
              {item.helper ? (
                <span className="mt-1 text-[11px] font-medium opacity-80">
                  {item.helper}
                </span>
              ) : null}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

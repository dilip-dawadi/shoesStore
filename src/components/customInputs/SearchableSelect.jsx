import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronsUpDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  height = "h-[40px]",
  returnType = "id",
  searchable = false,
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption =
    returnType === "id"
      ? options.find((o) => o.id === value)
      : options.find((o) => o.label === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (o) => {
    onChange(returnType === "id" ? o.id : o.label);
    setOpen(false);
    setSearch("");
  };

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={disabled ? undefined : setOpen}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full flex items-center cursor-pointer  justify-between rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:bg-secondary/20 transition-colors",
            height,
          )}
        >
          <span
            className={
              selectedOption ? "text-foreground" : "text-muted-foreground"
            }
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={4}
          align="start"
          avoidCollisions={false}
          className="z-200 rounded-lg border border-border bg-card shadow-lg min-w-[var(--radix-popover-trigger-width)] w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Search input */}
          <div
            className={cn(
              "flex items-center border-b border-border px-3 py-2 gap-2",
              !searchable && "hidden",
            )}
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className={`flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground`}
            />
          </div>

          {/* Options list */}
          <div className="max-h-[240px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </p>
            ) : (
              filtered.map((o) => {
                const isSelected =
                  returnType === "id" ? value === o.id : value === o.label;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleSelect(o)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm cursor-pointer transition-colors text-left",
                      isSelected
                        ? "bg-accent/20 text-foreground font-medium"
                        : "hover:bg-accent/10 text-foreground",
                    )}
                  >
                    {o.label}
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 ml-2 text-accent" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

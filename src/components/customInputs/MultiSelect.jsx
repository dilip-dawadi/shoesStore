import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

export function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  nameInSchema,
  isDialogMultiSearchableSelect = false,
}) {
  const [open, setOpen] = React.useState(false);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [isMouseInside, setIsMouseInside] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setHasInteracted(false);
      setIsMouseInside(false);
    }
  }, [open]);

  const toggleValue = (value) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const form = useFormContext();
  if (!form) throw new Error("MultiSelect must be used within a FormProvider");

  const { error } = form.getFieldState(nameInSchema, form.formState);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            `w-full h-[54px] rounded-lg font-medium text-sm justify-between`,
            error?.message
              ? "text-destructive border-destructive"
              : "text-foreground border-border",
          )}
          type="button"
        >
          <div
            className={cn(
              isDialogMultiSearchableSelect
                ? error ||
                  (form.watch(nameInSchema) && form.watch(nameInSchema).length)
                  ? "opacity-100 pl-2"
                  : "opacity-50 pl-2"
                : "opacity-100",
              isDialogMultiSearchableSelect
                ? form.watch(nameInSchema) && form.watch(nameInSchema).length
                  ? "text-foreground"
                  : ""
                : "",
            )}
          >
            {selectedValues.length > 0 ? (
              <div className="flex gap-2 items-center truncate">
                {selectedValues.length === options.length ? (
                  <span className="text-sm text-muted-foreground">
                    All selected
                  </span>
                ) : (
                  <>
                    {options
                      .filter((o) => selectedValues.includes(o.id))
                      .slice(0, 1)
                      .map((o) => (
                        <div
                          key={o.id}
                          className="text-sm rounded px-2 py-1 bg-accent text-accent-foreground"
                        >
                          {o.label}
                        </div>
                      ))}

                    {selectedValues.length > 1 && (
                      <span className="text-sm text-muted-foreground">
                        {`+ ${selectedValues.length - 1} more`}
                      </span>
                    )}
                  </>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>

          <ChevronsUpDown
            className={cn(
              "h-4 w-4 opacity-50",
              isDialogMultiSearchableSelect ? "mr-1" : "",
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 min-w-[var(--radix-popover-trigger-width)] w-[var(--radix-popover-trigger-width)] rounded-lg max-h-[300px] overflow-y-auto pointer-events-auto"
        align="start"
        sideOffset={4}
        avoidCollisions={false}
        onWheel={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsMouseInside(true)}
        onMouseLeave={() => setIsMouseInside(false)}
      >
        <Command className="h-full">
          <CommandInput
            placeholder={`Search ${
              placeholder.split(" ")[1] || placeholder
            }...`}
          />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="max-h-[250px] overflow-y-auto">
            <CommandItem
              onSelect={() => {
                const allSelected = selectedValues.length === options.length;
                onChange(allSelected ? [] : options.map((o) => o.id));
              }}
              className="font-medium cursor-pointer hover:bg-accent/10"
            >
              {selectedValues.length === options.length
                ? "Unselect All"
                : "Select All"}
            </CommandItem>
            {options.map((o, index) => (
              <CommandItem
                key={o.id}
                onSelect={() => toggleValue(o.id)}
                onMouseEnter={() => setHasInteracted(true)}
                className={cn(
                  "flex justify-between cursor-pointer py-2 rounded-md my-1",
                  selectedValues.includes(o.id)
                    ? "bg-accent text-accent-foreground"
                    : !selectedValues.length && !hasInteracted && index === 0
                      ? "bg-accent/50"
                      : "hover:bg-accent/10",
                  !isMouseInside &&
                    !selectedValues.includes(o.id) &&
                    "data-[selected=true]:bg-accent/10",
                )}
              >
                {o.label}
                {selectedValues.includes(o.id) && <Check className="h-4 w-4" />}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

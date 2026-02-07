import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select option",
  nameInSchema = "",
  height = "h-[40px]",
  returnType = "id",
  disabled = false,
  isDialogSearchableSelect = false,
  autoFocusSearch = true,
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

  const selectedOption =
    returnType === "id"
      ? options.find((o) => o.id === value)
      : options.find((o) => o.label === value);

  const form = useFormContext();
  let error;
  if (form) {
    error = form.getFieldState(nameInSchema, form.formState)?.error;
  }
  
  const formatValue = (value) => {
    if (!value) return value;

    const firstChar = value.charAt(0);
    // If first character is a number, keep it as is
    if (/\d/.test(firstChar)) {
      return firstChar + value.slice(1).toLowerCase();
    }
    // if email then lowercase all
    if (value.includes("@")) {
      return value.toLowerCase();
    }
    // If first character is a letter, uppercase it
    return firstChar.toUpperCase() + value.slice(1).toLowerCase();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        if (disabled) return;
        setOpen(newOpen);
      }}
      modal={true}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            `w-full rounded-lg font-medium text-sm justify-between`,
            error?.message
              ? "text-destructive border-destructive"
              : "text-foreground border-border",
            height,
            !autoFocusSearch && "focus-visible:outline-none focus:outline-none"
          )}
          disabled={disabled}
          onMouseDown={(e) => {
            // For Safari: prevent button from receiving focus on mousedown
            if (!autoFocusSearch) {
              e.preventDefault();
            }
          }}
          onFocus={(e) => {
            // For Safari: immediately blur if autoFocusSearch is false
            if (!autoFocusSearch) {
              e.currentTarget.blur();
            }
          }}
        >
          <div
            className={cn(
              isDialogSearchableSelect
                ? error || (form && form.watch(nameInSchema))
                  ? "opacity-100 pl-2"
                  : "opacity-50 pl-2"
                : "opacity-100",
              isDialogSearchableSelect
                ? form && form.watch(nameInSchema)
                  ? "text-foreground"
                  : ""
                : ""
            )}
          >
            {selectedOption ? formatValue(selectedOption.label) : placeholder}
          </div>
          <ChevronsUpDown
            className={cn(
              "h-4 w-4 opacity-50",
              isDialogSearchableSelect ? "mr-1" : ""
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
        <Command shouldFilter={true}>
          <CommandInput
            placeholder={`Search ${
              placeholder.split(" ")[1] || placeholder
            }...`}
            onFocus={(e) => {
              if (!autoFocusSearch) {
                e.target.blur();
              }
            }}
          />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="max-h-[250px] overflow-y-auto">
            {options.map((o, index) => {
              const isSelected =
                returnType === "id" ? value === o.id : value === o.label;
              return (
                <CommandItem
                  key={o.id}
                  value={o.label}
                  onSelect={() => {
                    onChange(returnType === "id" ? o.id : o.label);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setHasInteracted(true)}
                  className={cn(
                    "flex justify-between cursor-pointer py-2 rounded-md my-1",
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : !value && !hasInteracted && index === 0
                      ? "bg-accent/50"
                      : "hover:bg-accent/10",
                    !isMouseInside &&
                      !isSelected &&
                      "data-[selected=true]:bg-accent/10"
                  )}
                >
                  {formatValue(o.label)}
                  {isSelected && <Check className="h-4 w-4" />}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

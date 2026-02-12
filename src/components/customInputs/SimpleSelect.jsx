import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";

export function SimpleSelect({
  options,
  value,
  onChange,
  placeholder = "Select option",
  height = "h-[40px]",
  returnType = "id",
  disabled = false,
  className = "",
}) {
  const selectedOption =
    returnType === "id"
      ? options.find((o) => o.id === value)
      : options.find((o) => o.label === value);

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

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    if (returnType === "id") {
      onChange(selectedValue);
    } else {
      const option = options.find((o) => o.id === selectedValue);
      onChange(option ? option.label : selectedValue);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <select
        value={returnType === "id" ? value : selectedOption?.id || ""}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg font-medium text-sm px-4 pr-10 appearance-none bg-background text-foreground border border-border focus:ring-2 focus:ring-accent focus:border-transparent disabled:bg-secondary/20 disabled:cursor-not-allowed transition-colors",
          height,
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {formatValue(option.label)}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </div>
    </div>
  );
}

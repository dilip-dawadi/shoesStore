import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Checkbox } from "@/components/ui/checkbox";

export function CheckboxWithLabel({
  fieldTitle,
  nameInSchema,
  message,
  disabled = false,
}) {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name={nameInSchema}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel className="text-base w-1/3 -mt-2" htmlFor={nameInSchema}>
            {fieldTitle}
          </FormLabel>

          <FormControl>
            <label
              htmlFor={nameInSchema}
              className="flex items-center gap-2 cursor-pointer text-foreground"
            >
              {message}
              <Checkbox
                id={nameInSchema}
                className="w-6 h-6"
                checked={
                  nameInSchema === "featured"
                    ? field.value === true
                    : field.value === "open"
                }
                onCheckedChange={(checked) =>
                  field.onChange(
                    nameInSchema === "featured"
                      ? checked
                        ? true
                        : false
                      : checked
                        ? "open"
                        : "close",
                  )
                }
                disabled={disabled}
              />
            </label>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

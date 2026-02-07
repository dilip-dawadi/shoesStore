import { useState } from "react";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function InputWithLabel({
  fieldTitle,
  nameInSchema,
  className,
  ...props
}) {
  const form = useFormContext();
  if (!form)
    throw new Error("InputWithLabel must be used within a FormProvider");

  const { error } = form.getFieldState(nameInSchema, form.formState);
  const [onFocus, setOnFocus] = useState(false);

  return (
    <FormField
      control={form.control}
      name={nameInSchema}
      render={({ field }) => (
        <FormItem>
          <div
            className={`relative w-full ${
              props.disabled ? "cursor-not-allowed" : ""
            }`}
          >
            <FormLabel
              htmlFor={nameInSchema}
              className={`absolute left-3 font-medium transition-all text-xs top-[-0.65rem] px-1 z-5 ${
                error?.message
                  ? "text-destructive bg-card"
                  : "bg-card text-foreground tracking-wider"
              }`}
            >
              {error?.message ? error?.message : fieldTitle}
            </FormLabel>

            <FormControl>
              <Input
                id={nameInSchema}
                className={`w-full ${
                  error
                    ? "border-destructive text-destructive placeholder:text-destructive/50"
                    : "text-foreground placeholder:text-muted-foreground"
                } ${className || ""}`}
                onFocus={() => setOnFocus(true)}
                onBlur={() => setOnFocus(false)}
                placeholder={
                  !error?.message && !onFocus ? props.placeholder : ""
                }
                {...props}
                {...field}
                onChange={(e) =>
                  field.onChange(
                    props.type === "number"
                      ? e.target.value === ""
                        ? 0
                        : Number(e.target.value)
                      : e.target.value,
                  )
                }
              />
            </FormControl>
          </div>
        </FormItem>
      )}
    />
  );
}

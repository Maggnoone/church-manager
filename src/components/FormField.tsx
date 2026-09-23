import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactElement<any>;
  className?: string;
}

export function FormField({ label, required, error, children, className }: FormFieldProps) {
  const id = React.useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {React.cloneElement(children, {
        id,
        "aria-invalid": !!error,
        "aria-describedby": errorId,
      })}
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

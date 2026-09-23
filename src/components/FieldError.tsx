import type { UseFormReturn, FieldValues } from "react-hook-form";

interface FieldErrorProps<T extends FieldValues = FieldValues> {
  name: keyof T & string;
  form: UseFormReturn<T>;
}

export function FieldError<T extends FieldValues>({ name, form }: FieldErrorProps<T>) {
  const error = form.formState.errors[name];
  if (!error) return null;
  return (
    <p className="text-xs font-medium text-destructive">
      {String(error.message ?? "Campo inválido")}
    </p>
  );
}

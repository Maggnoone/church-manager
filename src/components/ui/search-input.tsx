import * as React from "react";

import { cn } from "@/lib/utils";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, leftIcon, rightSlot, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-full border border-border bg-card px-4 shadow-soft transition focus-within:ring-2 focus-within:ring-ring/20",
          containerClassName,
        )}
      >
        {leftIcon ? (
          <span className="text-muted-foreground [&_svg]:size-4" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        {rightSlot}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";

export { SearchInput };

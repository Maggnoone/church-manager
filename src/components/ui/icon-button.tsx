import * as React from "react";

import { cn } from "@/lib/utils";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  dot?: boolean;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, dot = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-soft transition hover:-translate-y-px hover:shadow-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
          className,
        )}
        {...props}
      >
        {children}
        {dot ? (
          <span
            aria-hidden="true"
            className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card"
          />
        ) : null}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";

export { IconButton };

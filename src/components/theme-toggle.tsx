import { Moon, Sun } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { toggle } = useTheme();

  return (
    <IconButton onClick={toggle} aria-label="Cambiar tema" title="Cambiar tema">
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </IconButton>
  );
}

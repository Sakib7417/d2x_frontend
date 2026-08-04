"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  balancesVisibilityToggled,
  commandPaletteSet,
  selectBalancesHidden,
  selectCommandPaletteOpen,
} from "@/store/slices/ui-slice";
import type { NavSection } from "@/config/navigation";

/**
 * ⌘K command palette.
 *
 * Built from the same `NavSection[]` the sidebar renders, so it can never fall
 * out of sync with the actual routes.
 *
 * Power users on an exchange navigate by keyboard; this is table stakes rather
 * than a flourish. Actions (theme, privacy) live here too, since they are the
 * two settings people toggle most and hunting for them in a menu is friction.
 */

export interface CommandPaletteProps {
  sections: NavSection[];
  onSignOut?: () => void;
}

export function CommandPalette({ sections, onSignOut }: CommandPaletteProps) {
  const open = useAppSelector(selectCommandPaletteOpen);
  const balancesHidden = useAppSelector(selectBalancesHidden);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  // Global ⌘K / Ctrl+K.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        dispatch(commandPaletteSet(!open));
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dispatch, open]);

  const close = () => dispatch(commandPaletteSet(false));

  const run = (action: () => void) => {
    // Close first so the dialog's exit animation overlaps the navigation,
    // rather than the palette lingering over the new page.
    close();
    action();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => dispatch(commandPaletteSet(next))}
      title="Command palette"
      description="Search pages and run actions"
    >
      <CommandInput placeholder="Search pages and actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {sections.map((section, index) => (
          <CommandGroup
            key={section.label ?? `group-${index}`}
            heading={section.label ?? "Navigation"}
          >
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  // `value` is what cmdk fuzzy-matches against, so the
                  // keywords ride along with the label here.
                  value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                  onSelect={() => run(() => router.push(item.href))}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            value="toggle theme dark light appearance"
            onSelect={() =>
              run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))
            }
          >
            {resolvedTheme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            <span>
              Switch to {resolvedTheme === "dark" ? "light" : "dark"} theme
            </span>
          </CommandItem>

          <CommandItem
            value="hide show balances privacy mask"
            onSelect={() => run(() => dispatch(balancesVisibilityToggled()))}
          >
            {balancesHidden ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
            <span>{balancesHidden ? "Show balances" : "Hide balances"}</span>
          </CommandItem>

          {onSignOut && (
            <CommandItem
              value="sign out log out logout"
              onSelect={() => run(onSignOut)}
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

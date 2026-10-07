"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, List, TrendingUp } from "lucide-react";

const TABS = [
  { href: "/train", label: "Train", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/routines", label: "Routines", icon: List },
] as const;

// A live workout and the routine builder are focused screens with their own
// controls at the bottom, so the tab bar stays out of their way.
const FOCUSED = /^\/(train|routines)\/.+/;

/** Tab bar for phones; wider screens use the links in the header. */
export function BottomNav() {
  const pathname = usePathname();
  if (FOCUSED.test(pathname)) return null;

  return (
    <>
      {/* Keeps the end of the page clear of the fixed bar. */}
      <div aria-hidden="true" className="h-20 sm:hidden" />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t bg-background px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden"
      >
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 text-xs ${
                active ? "font-bold text-primary" : "font-medium text-muted-foreground"
              }`}
            >
              <Icon className="size-6" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

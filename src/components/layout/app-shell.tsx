import Link from "next/link";
import { signOut } from "@/app/actions/sign-out";
import { cn } from "@/lib/ui";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plan/current-week", label: "Plan" },
  { href: "/cart", label: "Cart" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

type AppShellProps = {
  children: React.ReactNode;
  currentPath?: string;
  title?: string;
  weekLabel?: string;
  withNavigation?: boolean;
};

export function AppShell({
  children,
  currentPath,
  title = "Easy Grocer",
  weekLabel = "Current Week",
  withNavigation = true,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="text-base font-semibold tracking-tight">
            {title}
          </Link>
          <p className="hidden text-sm text-text-secondary md:block">{weekLabel}</p>
          <Link
            href="/settings"
            className="rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-strong"
          >
            Profile
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1200px] gap-6 px-4 py-6 sm:px-6">
        {withNavigation ? (
          <aside className="hidden w-56 shrink-0 rounded-xl border border-border bg-surface p-3 md:flex md:flex-col">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-[10px] px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-strong hover:text-foreground",
                    currentPath === item.href && "bg-surface-strong text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-1 pt-6">
              <Link
                href="/settings"
                className="block rounded-[10px] px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-strong hover:text-foreground"
              >
                Settings
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full rounded-[10px] px-3 py-2 text-left text-sm font-medium text-text-secondary transition hover:bg-surface-strong hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        ) : null}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      {withNavigation ? (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 p-2 backdrop-blur md:hidden">
          <ul className="mx-auto grid max-w-[1200px] grid-cols-5 gap-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-[10px] px-2 text-xs font-medium text-text-secondary",
                    currentPath === item.href && "bg-surface-strong text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

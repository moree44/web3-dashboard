import { LogOut } from "lucide-react";

import { logout } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className="flex h-9 w-full items-center gap-3 rounded-[9px] px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-card/40 hover:text-foreground">
        <LogOut aria-hidden="true" className="size-4" strokeWidth={1.8} />
        Log out
      </button>
    </form>
  );
}

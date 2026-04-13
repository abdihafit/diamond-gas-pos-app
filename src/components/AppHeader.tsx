import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Flame, LogOut } from "lucide-react";

export default function AppHeader() {
  const { user, role, signOut } = useAuth();

  return (
    <header className="border-b bg-card px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Flame className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Diamond Gas</h1>
            <span className="text-xs capitalize text-muted-foreground">{role} Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:block">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

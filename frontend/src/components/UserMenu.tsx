import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS, useAuth } from '@/lib/auth-context';

export function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right leading-tight sm:block">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">
          {ROLE_LABELS[user.role]}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        aria-label="Se déconnecter"
        title="Se déconnecter"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

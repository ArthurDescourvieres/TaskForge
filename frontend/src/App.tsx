import { LoginPage } from '@/components/LoginPage';
import { TicketQueue } from '@/components/TicketQueue';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/lib/auth-context';

function App() {
  const { user, loading } = useAuth();

  return (
    <>
      {/* Pendant la vérification du jeton stocké, on n'affiche ni la file ni
          l'écran de connexion : faire clignoter le formulaire pour quelqu'un
          de déjà connecté donnerait l'impression d'avoir été déconnecté. */}
      {loading ? (
        <div className="flex min-h-svh items-center justify-center">
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      ) : user ? (
        <TicketQueue />
      ) : (
        <LoginPage />
      )}

      <Toaster position="bottom-right" />
    </>
  );
}

export default App;

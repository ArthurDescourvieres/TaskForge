import { useEffect, useState } from 'react';
import { LoginPage } from '@/components/LoginPage';
import { RegisterPage } from '@/components/RegisterPage';
import { TicketQueue } from '@/components/TicketQueue';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/lib/auth-context';

function App() {
  const { user, loading } = useAuth();
  // Deux écrans, pas de router : une URL par formulaire d'authentification
  // n'apporterait rien ici, et le reste de l'application tient sur une page.
  const [view, setView] = useState<'login' | 'register'>('login');

  // Après une déconnexion, on revient à la connexion : quelqu'un qui s'était
  // inscrit puis déconnecté retombait sur le formulaire d'inscription, alors
  // qu'il a désormais un compte.
  useEffect(() => {
    if (!user) setView('login');
  }, [user]);

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
      ) : view === 'register' ? (
        <RegisterPage onSwitchToLogin={() => setView('login')} />
      ) : (
        <LoginPage onSwitchToRegister={() => setView('register')} />
      )}

      <Toaster position="bottom-right" />
    </>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { LocationProvider } from './LocationContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Booking } from './pages/Booking';
import { Gallery } from './pages/Gallery';
import { Dashboard } from './pages/Dashboard';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';
import { firebaseUtils } from './lib/firebaseUtils';
import { Service } from './types';
import { LoginLock } from './components/LoginLock';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import './i18n'; // Initialize i18n

function AppContent() {
  const { profile, isDeveloper, isLicenseActive } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    // Apply dark theme globally
    document.documentElement.classList.add('dark');
    
    // Check for Square Callback (if adding square later)
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    if (success === 'true') {
      toast.success(t('booking.success'));
    }
  }, [t]);

  // Seed initial services if none exist and user is admin
  useEffect(() => {
    const seedServices = async () => {
      if (profile?.role !== 'admin') return;

      try {
        const existing = await firebaseUtils.getCollection<Service>('services');
        if (existing.length === 0) {
          const initialServices: Omit<Service, 'id'>[] = [
            { name: 'Corte Social', price: 60, duration: 45, description: 'Corte clássico com acabamento na máquina e tesoura.' },
            { name: 'Barba Completa', price: 45, duration: 30, description: 'Barba feita com toalha quente e produtos premium.' },
            { name: 'Combo (Corte + Barba)', price: 90, duration: 75, description: 'O pacote completo para o seu estilo.' },
            { name: 'Corte Kids', price: 50, duration: 40, description: 'Corte especial para os pequenos.' }
          ];
          for (const s of initialServices) {
            await firebaseUtils.addDocument('services', s);
          }
        }
      } catch (error) {
        console.error('Seeding error:', error);
      }
    };
    seedServices();
  }, [profile]);

  if (!isLicenseActive && !isDeveloper) {
    return <LoginLock />;
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agendar" element={<Booking />} />
            <Route path="/galeria" element={<Gallery />} />
            <Route path="/painel" element={<Dashboard />} />
          </Routes>
        </Layout>
        <Toaster position="top-center" theme="dark" />
      </Router>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <AppContent />
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;

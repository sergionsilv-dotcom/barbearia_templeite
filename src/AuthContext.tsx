import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Barber, UserPermission } from './types';

interface AuthContextType {
  user: User | null;
  profile: Barber | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: UserPermission) => boolean;
  isDeveloper: boolean;
  isLicenseActive: boolean;
  isPro: boolean;
  trialDaysRemaining: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLicenseActive, setIsLicenseActive] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);

  const isDeveloper = user?.email === import.meta.env.VITE_DEVELOPER_EMAIL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // 1. Fetch license info and trial status (Universal - for everyone)
      const sysDocRef = doc(db, 'settings', 'system');
      const sysDoc = await getDoc(sysDocRef);
      
      let licenseStatus = true;
      let proStatus = false;
      let daysLeft: number | null = null;

      if (sysDoc.exists()) {
        const data = sysDoc.data();
        licenseStatus = data.active !== false;
        proStatus = data.isPro === true;

        // Trial Logic
        if (!proStatus) {
          let trialStart = data.trialStartedAt;
          
          // Auto-initialize trial if not present
          if (!trialStart) {
            trialStart = new Date().toISOString();
            await setDoc(sysDocRef, { ...data, trialStartedAt: trialStart }, { merge: true });
          }

          const startDate = new Date(trialStart);
          const now = new Date();
          const diffTime = now.getTime() - startDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          daysLeft = Math.max(0, 30 - diffDays);
          
          // Block if expired and not pro
          if (daysLeft <= 0) {
            licenseStatus = false;
          }
        }
      } else {
        // Initialize fresh system settings if missing
        const trialStart = new Date().toISOString();
        await setDoc(sysDocRef, { active: true, isPro: false, trialStartedAt: trialStart });
        daysLeft = 30;
      }

      setIsLicenseActive(licenseStatus);
      setIsPro(proStatus);
      setTrialDaysRemaining(daysLeft);

      setUser(user);
      if (user) {

        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data() as Barber;
          // Ensure admin has all permissions
          if (userData.role === 'admin') {
            userData.permissions = [
              'view_calendar',
              'manage_appointments',
              'view_financials',
              'manage_inventory',
              'manage_expenses',
              'manage_users',
              'manage_services'
            ];
          }
          setProfile(userData);
        } else {
          // Create default profile for new user
          const isFirstAdmin = user.email === import.meta.env.VITE_DEVELOPER_EMAIL;
          const newProfile: Barber = {
            uid: user.uid,
            name: user.displayName || 'Anonymous',
            photoURL: user.photoURL || '',
            role: isFirstAdmin ? 'admin' : 'barber',
            permissions: isFirstAdmin ? [
              'view_calendar',
              'manage_appointments',
              'view_financials',
              'manage_inventory',
              'manage_expenses',
              'manage_users',
              'manage_services'
            ] : ['view_calendar', 'manage_appointments'],
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Handle status change
    console.log('Auth: Listener montado');

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    console.log('Auth: Tentando login com PopUp...');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Auth: Login sucesso:', result.user.email);
    } catch (error: any) {
      console.error('Auth: Erro no login:', error);
      alert('Erro ao entrar: ' + (error.message || 'Verifique sua conexão'));
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const hasPermission = (permission: UserPermission): boolean => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return profile.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, signIn, logout, hasPermission, 
      isDeveloper, isLicenseActive, isPro, trialDaysRemaining 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

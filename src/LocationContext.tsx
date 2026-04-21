import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { Branch, NetworkConfig } from './types';
import { useTranslation } from 'react-i18next';

interface LocationContextType {
  branches: Branch[];
  networkConfig: NetworkConfig;
  activeBranch: string | null;
  setActiveBranch: (id: string | null) => void;
  loading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const DEFAULT_CONFIG: NetworkConfig = {
  id: 'main',
  name: 'Barbearia System',
  logo: '',
  favicon: '',
  primaryColor: '#b45309',
  secondaryColor: '#1e1b4b',
  instagram: '',
  facebook: '',
  whatsapp: '',
  phone: '',
  slogan: 'Tradição e Modernidade',
  about: '',
  language: 'pt-BR',
  currency: 'BRL',
  updatedAt: new Date().toISOString()
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>(DEFAULT_CONFIG);
  const [activeBranch, setActiveBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to network configuration
    const configUnsubscribe = onSnapshot(doc(db, 'config', 'network'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as NetworkConfig;
        setNetworkConfig(data);
        
        // Sync i18n language with database preference
        if (data.language && i18n.language !== data.language) {
          i18n.changeLanguage(data.language);
        }
      }
      setLoading(false);
    });

    // Listen to branches
    const branchesUnsubscribe = onSnapshot(collection(db, 'branches'), (snapshot) => {
      const branchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
      setBranches(branchesData);
      
      // Auto-select main branch if nothing active
      if (!activeBranch && branchesData.length > 0) {
        const main = branchesData.find(b => b.isMain);
        setActiveBranch(main ? main.id : branchesData[0].id);
      }
    });

    return () => {
      configUnsubscribe();
      branchesUnsubscribe();
    };
  }, [i18n, activeBranch]);

  return (
    <LocationContext.Provider value={{ branches, networkConfig, activeBranch, setActiveBranch, loading }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};

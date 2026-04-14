import React, { createContext, useContext, useState, useEffect } from 'react';
import { firebaseUtils } from './lib/firebaseUtils';
import { Branch } from './types';

interface NetworkConfig {
  name: string;
  instagram: string;
  phone: string;
  slogan: string;
  squareLocationId?: string; // ID da localização no painel Square Developer
  squareApplicationId?: string; // ID do aplicativo no painel Square Developer
}

interface LocationContextType {
  branches: Branch[];
  activeBranchId: string | null;
  activeBranch: Branch | null;
  setActiveBranchId: (id: string) => void;
  networkConfig: NetworkConfig;
  updateNetworkConfig: (config: Partial<NetworkConfig>) => Promise<void>;
  loading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const DEFAULT_CONFIG: NetworkConfig = {
  name: 'O Barbeiro Sergio',
  instagram: 'obarbeirosergio',
  phone: '',
  slogan: 'Tradição & Estilo Moderno',
  squareLocationId: '',
  squareApplicationId: '',
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(localStorage.getItem('activeBranchId'));
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Subscribe to branches
    const unsubBranches = firebaseUtils.subscribeToCollection<Branch>('branches', [], async (data) => {
      if (data.length === 0) {
        // Auto-seed first branch if none exists
        const defaultBranch: Omit<Branch, 'id'> = {
          name: 'Matriz Principal',
          address: 'Endereço da Matriz',
          phone: '',
          isMain: true,
          active: true,
          createdAt: new Date().toISOString()
        };
        await firebaseUtils.addDocument('branches', defaultBranch);
        return; // Snapshot will trigger again
      }

      setBranches(data);
      
      // Auto-select main branch if none selected or if selected is missing
      const main = data.find(b => b.isMain) || data[0];
      if (!activeBranchId || !data.some(b => b.id === activeBranchId)) {
        setActiveBranchId(main.id);
        localStorage.setItem('activeBranchId', main.id);
      }
      setLoading(false);
    });

    // 2. Fetch network config
    const fetchConfig = async () => {
      const config = await firebaseUtils.getDocument<NetworkConfig>('settings', 'network');
      if (config) {
        setNetworkConfig(config);
      } else {
        // Initialize with default if not exists
        await firebaseUtils.setDocument('settings', 'network', DEFAULT_CONFIG);
      }
    };

    fetchConfig();

    return () => { unsubBranches(); };
  }, [activeBranchId]);

  const activeBranch = branches.find(b => b.id === activeBranchId) || null;

  const handleSetActiveBranchId = (id: string) => {
    setActiveBranchId(id);
    localStorage.setItem('activeBranchId', id);
  };

  const updateNetworkConfig = async (config: Partial<NetworkConfig>) => {
    const newConfig = { ...networkConfig, ...config };
    await firebaseUtils.setDocument('settings', 'network', newConfig);
    setNetworkConfig(newConfig);
  };

  return (
    <LocationContext.Provider value={{ 
      branches, 
      activeBranchId, 
      activeBranch,
      setActiveBranchId: handleSetActiveBranchId, 
      networkConfig,
      updateNetworkConfig,
      loading 
    }}>
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

import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthContext';
import { firebaseUtils } from '../lib/firebaseUtils';
import { Appointment, Service, Client, Barber, Transaction, Product } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import {
  Scissors, Calendar, Users, DollarSign, UserCircle, Settings, Package, Receipt, UserCog, Globe, Store, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { ClientsTab } from '../components/tabs/ClientsTab';
import { ProfessionalsTab } from '../components/tabs/ProfessionalsTab';
import { ServicesTab } from '../components/tabs/ServicesTab';
import { PaymentsTab } from '../components/tabs/PaymentsTab';
import { InventoryTab } from '../components/tabs/InventoryTab';
import { ExpensesTab } from '../components/tabs/ExpensesTab';
import { AdminUsersTab } from '../components/tabs/AdminUsersTab';
import { SettingsTab } from '../components/tabs/SettingsTab';
import { BranchesTab } from '../components/tabs/BranchesTab';
import { AppointmentsTab } from '../components/tabs/AppointmentsTab';
import { useLocationContext } from '../LocationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import React, { useState, useEffect } from 'react';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { profile, hasPermission, trialDaysRemaining, isPro, loading: authLoading } = useAuth();
  const { branches, activeBranchId, setActiveBranchId, activeBranch, networkConfig } = useLocationContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');

  useEffect(() => {
    if (!profile) return;

    const unsubApt = firebaseUtils.subscribeToCollection<Appointment>(
      'appointments', [],
      (data) => {
        const isAll = activeBranchId === 'all';
        const filteredByLocation = data.filter(a => 
          isAll || !activeBranchId || a.locationId === activeBranchId || (!a.locationId && activeBranch?.isMain)
        );
        const sorted = filteredByLocation.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAppointments(profile.role === 'barber' ? sorted.filter(a => a.barberId === profile.uid) : sorted);
        setLoading(false);
      }
    );

    const unsubSvc = firebaseUtils.subscribeToCollection<Service>('services', [], (data) => {
      const isAll = activeBranchId === 'all';
      setServices(data.filter(s => isAll || !activeBranchId || s.locationId === activeBranchId || !s.locationId));
    });
    
    const unsubCli = firebaseUtils.subscribeToCollection<Client>('clients', [], setClients);
    
    return () => { unsubApt(); unsubSvc(); unsubCli(); };
  }, [profile, activeBranchId, activeBranch]);

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager' && profile.role !== 'barber')) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <UserCircle className="h-16 w-16 text-gray-600" />
        <h2 className="text-xl font-bold uppercase tracking-widest text-white">{t('dashboard.access_denied')}</h2>
        <p className="text-gray-500 text-sm">{t('dashboard.access_denied_msg', { name: networkConfig.name })}</p>
        <Button onClick={() => window.location.href = '/'}>{t('nav.home')}</Button>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';
  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">{t('dashboard.title')}</h1>
          <p className="text-gray-500 uppercase tracking-widest text-xs font-bold mt-2">{t('dashboard.welcome')}, {profile.name}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {!isPro && trialDaysRemaining !== null && (
            <div className="px-3 py-1.5 border border-amber-500/20 bg-amber-500/10 flex flex-col items-center">
              <span className="text-[8px] uppercase tracking-widest font-black text-amber-500">{t('dashboard.trial_period')}</span>
              <span className="text-sm font-black italic text-white -mt-1">{trialDaysRemaining} {t('dashboard.days')}</span>
            </div>
          )}
          <Button variant="outline" onClick={() => setActiveTab('settings')}><Settings className="h-4 w-4 mr-2" /> {t('dashboard.settings')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <Card className="bg-white/[0.02] border-white/10 rounded-none"><CardHeader><CardTitle className="text-xs uppercase text-gray-500">{t('dashboard.total_appointments')}</CardTitle></CardHeader><CardContent><div className="text-3xl font-black italic text-amber-500">{appointments.length}</div></CardContent></Card>
        <Card className="bg-white/[0.02] border-white/10 rounded-none"><CardHeader><CardTitle className="text-xs uppercase text-gray-500">{t('dashboard.pending')}</CardTitle></CardHeader><CardContent><div className="text-3xl font-black italic text-white">{pendingCount}</div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white/5 rounded-none p-1 border border-white/10 h-auto gap-1">
          <TabsTrigger value="appointments" className="rounded-none uppercase tracking-widest text-xs"><Calendar className="h-3.5 w-3.5 mr-1.5" /> {t('tabs.appointments')}</TabsTrigger>
          <TabsTrigger value="clients" className="rounded-none uppercase tracking-widest text-xs"><UserCircle className="h-3.5 w-3.5 mr-1.5" /> {t('tabs.clients')}</TabsTrigger>
          {(hasPermission('view_financials') || profile.role === 'barber') && <TabsTrigger value="payments" className="rounded-none uppercase tracking-widest text-xs"><DollarSign className="h-3.5 w-3.5 mr-1.5" /> {t('tabs.financial')}</TabsTrigger>}
          {isAdmin && <TabsTrigger value="professionals" className="rounded-none uppercase tracking-widest text-xs"><Users className="h-3.5 w-3.5 mr-1.5" /> {t('tabs.professionals')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="appointments"><AppointmentsTab /></TabsContent>
        <TabsContent value="clients"><ClientsTab /></TabsContent>
        <TabsContent value="payments"><PaymentsTab /></TabsContent>
        {isAdmin && <TabsContent value="professionals"><ProfessionalsTab activeBranchId={activeBranchId} /></TabsContent>}
        {isAdmin && <TabsContent value="settings"><SettingsTab /></TabsContent>}
      </Tabs>
    </div>
  );
};

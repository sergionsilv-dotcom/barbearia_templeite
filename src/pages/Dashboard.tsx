import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { firebaseUtils } from '../lib/firebaseUtils';
import { Appointment, Service, Client, Barber, Transaction, Product } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Scissors, Calendar, Users, DollarSign, UserCircle, Settings, Package, Receipt, UserCog
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
import { AppointmentsCalendar } from '../components/AppointmentsCalendar';
import { useLocationContext } from '../LocationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Globe, Store, Building2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export const Dashboard: React.FC = () => {
  const { profile, hasPermission, isDeveloper, trialDaysRemaining, isPro, loading: authLoading } = useAuth();
  const { branches, activeBranchId, setActiveBranchId, activeBranch, networkConfig } = useLocationContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');

  useEffect(() => {
    if (!profile) return;

    const unsubApt = firebaseUtils.subscribeToCollection<Appointment>(
      'appointments', [],
      (data) => {
        const isAll = activeBranchId === 'all';
        // Filter by location
        const filteredByLocation = data.filter(a => 
          isAll || !activeBranchId || a.locationId === activeBranchId || (!a.locationId && activeBranch?.isMain)
        );
        
        const sorted = filteredByLocation.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAppointments(
          profile.role === 'barber'
            ? sorted.filter(a => a.barberId === profile.uid)
            : sorted
        );
        setLoading(false);
      }
    );

    const unsubSvc = firebaseUtils.subscribeToCollection<Service>('services', [], (data) => {
      const isAll = activeBranchId === 'all';
      setServices(data.filter(s => isAll || !activeBranchId || s.locationId === activeBranchId || !s.locationId));
    });
    
    const unsubCli = firebaseUtils.subscribeToCollection<Client>('clients', [], setClients);
    
    const unsubBarbers = firebaseUtils.subscribeToCollection<Barber>(
      'users', [],
      (data) => {
        const roles = ['barber', 'admin', 'manager'];
        const isAll = activeBranchId === 'all';
        const filtered = data.filter(u => 
          roles.includes(u.role) && 
          (isAll || !activeBranchId || u.locationId === activeBranchId || !u.locationId)
        );
        setBarbers(filtered);
      }
    );

    return () => { unsubApt(); unsubSvc(); unsubCli(); unsubBarbers(); };
  }, [profile, activeBranchId, activeBranch]);

  const updateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await firebaseUtils.updateDocument('appointments', id, { status });
      toast.success(`Status atualizado para ${status}`);
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const handlePaymentRecord = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      // 1. Add transaction record
      await firebaseUtils.addDocument('sales', transaction);
      
      // 2. Mark appointment as completed
      if (transaction.appointmentId) {
        await firebaseUtils.updateDocument('appointments', transaction.appointmentId, { 
          status: 'completed' 
        });
      }

      // 3. Deduct stock for each product
      if (transaction.products && transaction.products.length > 0) {
        const pDoc = await firebaseUtils.getCollection<Product>('products', []);
        for (const item of transaction.products) {
          const p = pDoc.find(prod => prod.id === item.productId);
          if (p) {
            const newStock = Math.max(0, (p.currentStock || 0) - item.quantity);
            await firebaseUtils.updateDocument('products', item.productId, {
              currentStock: newStock
            });
          }
        }
      }

      toast.success(`Pagamento de R$ ${transaction.totalAmount.toFixed(2)} recebido com sucesso!`);
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error('Erro ao registrar pagamento.');
      throw error;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager' && profile.role !== 'barber')) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-white/5 flex items-center justify-center rounded-full">
          <UserCircle className="h-8 w-8 text-gray-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase tracking-widest text-white">Área Restrita</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Esta área é exclusiva para o dono e barbeiros da {networkConfig.name}.
          </p>
        </div>
        <div className="pt-4 flex flex-col gap-3 w-full max-w-xs">
          <Button 
            onClick={() => window.location.href = '/agendar'}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-none uppercase tracking-widest text-xs font-black py-6"
          >
            Quero fazer um Agendamento
          </Button>
          <Button 
            variant="ghost"
            onClick={() => window.location.href = '/'}
            className="text-gray-500 hover:text-white uppercase tracking-widest text-[10px]"
          >
            Voltar para o Início
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date.startsWith(today));
  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  const statusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':  return 'bg-green-500/20 text-green-400 border-green-500/20';
      case 'completed':  return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      case 'pending':    return 'bg-amber-500/20 text-amber-400 border-amber-500/20';
      case 'cancelled':  return 'bg-red-500/20 text-red-400 border-red-500/20';
      default:           return 'bg-white/10 text-gray-400 border-white/10';
    }
  };

  const statusLabel = (status: Appointment['status']) => {
    const labels: Record<Appointment['status'], string> = {
      pending: 'Pendente', confirmed: 'Confirmado',
      completed: 'Concluído', cancelled: 'Cancelado',
    };
    return labels[status] ?? status;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Painel</h1>
          <p className="text-gray-500 uppercase tracking-widest text-xs font-bold mt-2">
            Bem-vindo, {profile.name}
            <span className="ml-2 text-amber-500">· {profile.role}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {!isPro && trialDaysRemaining !== null && (
            <div className={`px-3 py-1.5 border ${
              trialDaysRemaining <= 5 
                ? 'bg-red-500/10 border-red-500/20 animate-pulse' 
                : 'bg-amber-500/10 border-amber-500/20'
            } flex flex-col items-center justify-center`}>
              <span className={`text-[8px] uppercase tracking-widest font-black ${
                trialDaysRemaining <= 5 ? 'text-red-500' : 'text-amber-500'
              }`}>
                Período de Teste
              </span>
              <span className="text-sm font-black italic text-white -mt-1">
                {trialDaysRemaining} {trialDaysRemaining === 1 ? 'Dia' : 'Dias'}
              </span>
            </div>
          )}

          <div className="flex flex-col items-end mr-4 hidden md:flex">
             <span className="text-[10px] uppercase tracking-widest font-black text-amber-500">Unidade Ativa</span>
             <Select value={activeBranchId || ''} onValueChange={setActiveBranchId}>
               <SelectTrigger className="w-[200px] h-9 bg-white/5 border-white/10 rounded-none uppercase tracking-widest text-[10px] font-bold">
                 <SelectValue placeholder="Selecionar Unidade" />
               </SelectTrigger>
               <SelectContent className="bg-[#111] border-white/10 text-white rounded-none">
                 {isAdmin && (
                    <SelectItem value="all" className="uppercase tracking-widest text-[10px] font-bold hover:bg-amber-600 focus:bg-amber-600 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        Todas as Unidades
                      </div>
                    </SelectItem>
                  )}
                 {branches.map(b => (
                   <SelectItem key={b.id} value={b.id} className="uppercase tracking-widest text-[10px] font-bold hover:bg-amber-600 focus:bg-amber-600 cursor-pointer">
                     <div className="flex items-center gap-2">
                       {b.isMain ? <Building2 className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                       {b.name}
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('settings')}
            className="border-white/10 rounded-none uppercase tracking-widest text-xs font-bold"
          >
            <Settings className="h-4 w-4 mr-2" /> Configurações
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <Card className="bg-white/[0.02] border-white/10 rounded-none">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs uppercase tracking-widest text-gray-500 font-bold">
              Total Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-black italic text-amber-500">{appointments.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10 rounded-none">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs uppercase tracking-widest text-gray-500 font-bold">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-black italic text-white">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10 rounded-none">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs uppercase tracking-widest text-gray-500 font-bold">
              Serviços Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-black italic text-white">{services.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10 rounded-none">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs uppercase tracking-widest text-gray-500 font-bold">
              Clientes Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-black italic text-white">{clients.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white/5 rounded-none p-1 border border-white/10 flex-wrap h-auto gap-1">
          <TabsTrigger
            value="appointments"
            className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Agenda
          </TabsTrigger>

          <TabsTrigger
            value="clients"
            className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            <UserCircle className="h-3.5 w-3.5 mr-1.5" /> Clientes
          </TabsTrigger>

          {hasPermission('manage_inventory') && (
            <TabsTrigger
              value="inventory"
              className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <Package className="h-3.5 w-3.5 mr-1.5" /> Estoque
            </TabsTrigger>
          )}

          {hasPermission('manage_expenses') && (
            <TabsTrigger
              value="expenses"
              className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <Receipt className="h-3.5 w-3.5 mr-1.5" /> Despesas
            </TabsTrigger>
          )}

          {hasPermission('view_financials') && (
            <TabsTrigger
              value="payments"
              className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Financeiro
            </TabsTrigger>
          )}

          {hasPermission('manage_services') && (
            <TabsTrigger
              value="services"
              className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <Scissors className="h-3.5 w-3.5 mr-1.5" /> Serviços
            </TabsTrigger>
          )}

          {isAdmin && (
            <TabsTrigger
              value="professionals"
              className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" /> Profissionais
            </TabsTrigger>
          )}

          {isAdmin && (
            <TabsTrigger
              value="team"
              className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <UserCog className="h-3.5 w-3.5 mr-1.5" /> Equipe
            </TabsTrigger>
          )}

          {isAdmin && (
            <TabsTrigger
              value="branches"
              className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <Building2 className="h-3.5 w-3.5 mr-1.5" /> Unidades
            </TabsTrigger>
          )}

          {isAdmin && (
            <TabsTrigger
              value="settings"
              className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <Globe className="h-3.5 w-3.5 mr-1.5" /> Rede / Marca
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Agendamentos ── */}
        <TabsContent value="appointments" className="space-y-4">
          <AppointmentsCalendar
            appointments={appointments}
            services={services}
            barbers={barbers}
            onStatusUpdate={updateStatus}
            onPaymentRecord={handlePaymentRecord}
          />
        </TabsContent>

        {/* ── Clientes ── */}
        <TabsContent value="clients">
          <ClientsTab />
        </TabsContent>

        {/* ── Estoque ── */}
        {hasPermission('manage_inventory') && (
          <TabsContent value="inventory">
            <InventoryTab />
          </TabsContent>
        )}

        {/* ── Despesas ── */}
        {hasPermission('manage_expenses') && (
          <TabsContent value="expenses">
            <ExpensesTab />
          </TabsContent>
        )}

        {/* ── Financeiro ── */}
        {hasPermission('view_financials') && (
          <TabsContent value="payments">
            <PaymentsTab />
          </TabsContent>
        )}

        {/* ── Serviços ── */}
        {hasPermission('manage_services') && (
          <TabsContent value="services">
            <ServicesTab activeBranchId={activeBranchId} />
          </TabsContent>
        )}

        {/* ── Profissionais ── */}
        {isAdmin && (
          <TabsContent value="professionals">
            <ProfessionalsTab activeBranchId={activeBranchId} />
          </TabsContent>
        )}

        {/* ── Equipe ── */}
        {isAdmin && (
          <TabsContent value="team">
            <AdminUsersTab />
          </TabsContent>
        )}

        {/* ── Unidades ── */}
        {isAdmin && (
          <TabsContent value="branches">
            <BranchesTab />
          </TabsContent>
        )}

        {/* ── Configurações ── */}
        {isAdmin && (
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

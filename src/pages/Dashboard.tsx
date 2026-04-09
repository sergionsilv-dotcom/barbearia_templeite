import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { firebaseUtils } from '../lib/firebaseUtils';
import { Appointment, Service, Client, Barber, Transaction } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Scissors, Calendar, Users, DollarSign, UserCircle, Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { ClientsTab } from '../components/tabs/ClientsTab';
import { ProfessionalsTab } from '../components/tabs/ProfessionalsTab';
import { ServicesTab } from '../components/tabs/ServicesTab';
import { PaymentsTab } from '../components/tabs/PaymentsTab';
import { AppointmentsCalendar } from '../components/AppointmentsCalendar';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const unsubApt = firebaseUtils.subscribeToCollection<Appointment>(
      'appointments', [],
      (data) => {
        const sorted = data.sort(
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

    const unsubSvc = firebaseUtils.subscribeToCollection<Service>('services', [], setServices);
    const unsubCli = firebaseUtils.subscribeToCollection<Client>('clients', [], setClients);
    const unsubBarbers = firebaseUtils.subscribeToCollection<Barber>(
      'users', [],
      (data) => setBarbers(data.filter(u => u.role === 'barber' || u.role === 'admin'))
    );

    return () => { unsubApt(); unsubSvc(); unsubCli(); unsubBarbers(); };
  }, [profile]);

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
      await firebaseUtils.updateDocument('appointments', transaction.appointmentId, { 
        status: 'completed' 
      });

      toast.success(`Pagamento de R$ ${transaction.totalAmount.toFixed(2)} recebido com sucesso!`);
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error('Erro ao registrar pagamento.');
      throw error;
    }
  };

  if (profile?.role !== 'admin' && profile?.role !== 'barber') {
    return (
      <div className="p-20 text-center text-gray-500 uppercase tracking-widest text-sm">
        Acesso negado.
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
        <Button variant="outline" className="border-white/10 rounded-none uppercase tracking-widest text-xs font-bold">
          <Settings className="h-4 w-4 mr-2" /> Configurações
        </Button>
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
      <Tabs defaultValue="appointments" className="space-y-8">
        <TabsList className="bg-white/5 rounded-none p-1 border border-white/10 flex-wrap h-auto gap-1">
          <TabsTrigger
            value="appointments"
            className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Agendamentos
          </TabsTrigger>

          <TabsTrigger
            value="clients"
            className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            <UserCircle className="h-3.5 w-3.5 mr-1.5" /> Clientes
          </TabsTrigger>

          {isAdmin && (
            <TabsTrigger
              value="professionals"
              className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" /> Profissionais
            </TabsTrigger>
          )}

          <TabsTrigger
            value="services"
            className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            <Scissors className="h-3.5 w-3.5 mr-1.5" /> Serviços
          </TabsTrigger>

          {isAdmin && (
            <TabsTrigger
              value="payments"
              className="rounded-none uppercase tracking-widest text-xs font-bold text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Pagamentos
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

        {/* ── Profissionais ── */}
        {isAdmin && (
          <TabsContent value="professionals">
            <ProfessionalsTab />
          </TabsContent>
        )}

        {/* ── Serviços ── */}
        <TabsContent value="services">
          <ServicesTab />
        </TabsContent>

        {/* ── Pagamentos ── */}
        {isAdmin && (
          <TabsContent value="payments">
            <PaymentsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

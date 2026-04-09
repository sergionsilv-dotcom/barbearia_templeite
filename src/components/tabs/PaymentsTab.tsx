import React, { useState, useEffect } from 'react';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Barber, Service, Appointment, Transaction } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, TrendingUp, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfessionalSummary {
  professional: Barber;
  appointmentsCount: number;
  grossAmount: number;
  tipAmount: number;
  totalAmount: number;
}

export const PaymentsTab: React.FC = () => {
  const [professionals, setProfessionals] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub1 = firebaseUtils.subscribeToCollection<Barber>('users', [], setProfessionals);
    const unsub2 = firebaseUtils.subscribeToCollection<Service>('services', [], setServices);
    const unsub3 = firebaseUtils.subscribeToCollection<Appointment>('appointments', [], (data) => {
      setAppointments(data);
    });
    const unsub4 = firebaseUtils.subscribeToCollection<Transaction>('sales', [], (data) => {
      setTransactions(data);
      setLoading(false);
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);

  // Reset paid status when month changes
  useEffect(() => {
    setPaidIds(new Set());
  }, [currentDate]);

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const monthStart = startOfMonth(currentDate).toISOString();
  const monthEnd = endOfMonth(currentDate).toISOString();

  // Filter appointments for this month (completed or confirmed)
  const monthAppointments = appointments.filter(a =>
    (a.status === 'completed' || a.status === 'confirmed') &&
    a.date >= monthStart &&
    a.date <= monthEnd
  );

  const monthTransactions = transactions.filter(t =>
    t.date >= monthStart &&
    t.date <= monthEnd
  );

  // Build per-professional summaries
  const summaries: ProfessionalSummary[] = professionals
    .map(pro => {
      const proApts = monthAppointments.filter(a => a.barberId === pro.uid);
      const proSales = monthTransactions.filter(t => t.barberId === pro.uid);
      
      const grossAmount = proApts.reduce((sum, a) => {
        const svc = services.find(s => s.id === a.serviceId);
        return sum + (svc?.price ?? 0);
      }, 0);

      const tipAmount = proSales.reduce((sum, t) => sum + (t.tipAmount ?? 0), 0);

      let totalAmount: number;
      if (pro.paymentType === 'salary') {
        totalAmount = (pro.salaryAmount ?? 0);
      } else {
        totalAmount = grossAmount * ((pro.commissionRate ?? 0) / 100);
      }

      return { professional: pro, appointmentsCount: proApts.length, grossAmount, tipAmount, totalAmount };
    })
    // Show if they worked this month OR have fixed salary
    .filter(s => s.appointmentsCount > 0 || s.professional.paymentType === 'salary');

  const totalRevenue = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalTips = monthTransactions.reduce((sum, t) => sum + (t.tipAmount ?? 0), 0);
  const totalPayout = summaries.reduce((sum, s) => sum + s.totalAmount, 0);
  const profit = totalRevenue - totalPayout;

  const togglePaid = (uid: string) => {
    setPaidIds(prev => {
      const next = new Set(prev);
      const wasPaid = next.has(uid);
      if (wasPaid) next.delete(uid); else next.add(uid);
      toast.success(wasPaid ? 'Pagamento desmarcado' : 'Pagamento marcado como pago!');
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Month selector */}
      <div className="flex items-center justify-between max-w-xs mx-auto">
        <Button
          onClick={prevMonth}
          variant="outline" size="icon"
          className="border-white/10 rounded-none hover:bg-white/5"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-black uppercase tracking-widest capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <Button
          onClick={nextMonth}
          variant="outline" size="icon"
          className="border-white/10 rounded-none hover:bg-white/5"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
            Serviços
          </p>
          <p className="text-2xl font-black italic text-amber-500">
            R$ {totalRevenue.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            {monthAppointments.length} atendimentos
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
            Gorjetas (Tips)
          </p>
          <p className="text-2xl font-black italic text-sky-400">
            R$ {totalTips.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Recebido direto
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
            Total Comissões
          </p>
          <p className="text-2xl font-black italic text-white">
            R$ {totalPayout.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            {summaries.filter(s => paidIds.has(s.professional.uid)).length}/{summaries.length} pagos
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
            Lucro Líquido
          </p>
          <p className={`text-2xl font-black italic ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            R$ {profit.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Exclui gorjetas
          </p>
        </div>
      </div>

      {/* Payments table */}
      <div className="bg-white/[0.02] border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 uppercase tracking-widest text-xs animate-pulse">
            Carregando...
          </div>
        ) : summaries.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 uppercase tracking-widest text-xs">
              Nenhum atendimento registrado neste mês.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Profissional</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Serviços</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Gorjetas</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Cálculo Comis.</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Comissão</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map(({ professional: pro, appointmentsCount, grossAmount, tipAmount, totalAmount }) => {
                  const isPaid = paidIds.has(pro.uid);
                  return (
                    <tr key={pro.uid} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="font-bold uppercase tracking-widest text-sm">{pro.name}</div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          {pro.paymentType === 'commission'
                            ? `${pro.commissionRate ?? 0}% de comissão`
                            : 'Fixo: R$ ' + (pro.salaryAmount ?? 0)}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-300">R$ {grossAmount.toFixed(2)}</td>
                      <td className="p-4 text-sm text-sky-400 font-bold italic">R$ {tipAmount.toFixed(2)}</td>
                      <td className="p-4 text-[10px] text-gray-500 italic">
                        {pro.paymentType === 'commission'
                          ? `(${pro.commissionRate}%) de R$ ${grossAmount.toFixed(2)}`
                          : `Salário Fixo`}
                      </td>
                      <td className="p-4">
                        <span className="text-amber-500 font-black italic text-xl">
                          R$ {totalAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          onClick={() => togglePaid(pro.uid)}
                          className={`rounded-none uppercase tracking-widest text-xs font-bold transition-colors ${
                            isPaid
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          {isPaid ? (
                            <><Check className="h-3 w-3 mr-1.5" /> Pago</>
                          ) : (
                            'Marcar Pago'
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {summaries.map(({ professional: pro, appointmentsCount, grossAmount, tipAmount, totalAmount }) => {
                const isPaid = paidIds.has(pro.uid);
                return (
                  <div key={pro.uid} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold uppercase tracking-widest text-sm">{pro.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          R$ {grossAmount.toFixed(2)} serviços · <span className="text-sky-400 font-bold italic">R$ {tipAmount.toFixed(2)} tips</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-500 font-black italic text-lg line-clamp-1">
                          R$ {totalAmount.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-tighter">Comissão</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => togglePaid(pro.uid)}
                      className={`w-full rounded-none uppercase tracking-widest text-xs font-bold ${
                        isPaid
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isPaid ? <><Check className="h-3 w-3 mr-1.5" /> Pago</> : 'Marcar Pago'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sales Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Fluxo de Caixa (Vendas)</h3>
        <div className="bg-white/[0.02] border border-white/10 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                <th className="p-3">Data/Hora</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Serviço</th>
                <th className="p-3">Profissional</th>
                <th className="p-3">Método</th>
                <th className="p-3 text-right">Serviço</th>
                <th className="p-3 text-right">Gorjeta</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {monthTransactions.sort((a,b) => b.date.localeCompare(a.date)).map(t => (
                <tr key={t.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-3 text-[10px] text-gray-500">{format(parseISO(t.date), 'dd/MM HH:mm')}</td>
                  <td className="p-3 text-xs font-bold uppercase tracking-tight">{t.customerName}</td>
                  <td className="p-3 text-xs text-gray-400">{t.serviceName}</td>
                  <td className="p-3 text-xs text-gray-500">{t.barberName}</td>
                  <td className="p-3">
                    <Badge className="bg-white/5 text-[9px] uppercase tracking-tighter border-white/10 text-gray-400">
                      {t.paymentMethod === 'cash' ? 'Dinheiro' : t.paymentMethod === 'card' ? 'Cartão' : t.paymentMethod === 'pix' ? 'PIX' : 'Outro'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right text-[11px] text-gray-400">R$ {t.amount.toFixed(2)}</td>
                  <td className="p-3 text-right text-[11px] text-sky-400 font-bold italic">R$ {(t.tipAmount ?? 0).toFixed(2)}</td>
                  <td className="p-3 text-right text-sm font-black italic text-amber-500">R$ {(t.totalAmount ?? t.amount).toFixed(2)}</td>
                </tr>
              ))}
              {monthTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-600 uppercase tracking-widest text-[10px]">Nenhuma venda registrada</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note */}
      <div className="flex items-start gap-2 text-xs text-gray-600">
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <span>
          O status "Pago" na tabela de profissionais é local. O histórico de vendas é salvo permanentemente no banco de dados.
        </span>
      </div>
    </div>
  );
};

import { parseISO } from 'date-fns';

import React, { useState, useEffect } from 'react';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Barber, Service, Appointment, Transaction, Expense } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, TrendingUp, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfessionalSummary {
  professional: Barber;
  appointmentsCount: number;
  serviceGross: number;
  productGross: number;
  serviceCommission: number;
  productCommission: number;
  tipAmount: number;
  totalAmount: number;
}

import { useLocationContext } from '../../LocationContext';

export const PaymentsTab: React.FC = () => {
  const { activeBranchId, activeBranch } = useLocationContext();
  const [professionals, setProfessionals] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub1 = firebaseUtils.subscribeToCollection<Barber>('users', [], setProfessionals);
    const unsub2 = firebaseUtils.subscribeToCollection<Service>('services', [], setServices);
    const unsub3 = firebaseUtils.subscribeToCollection<Appointment>('appointments', [], setAppointments);
    const unsub4 = firebaseUtils.subscribeToCollection<Transaction>('sales', [], setTransactions);
    const unsub5 = firebaseUtils.subscribeToCollection<Expense>('expenses', [], (data) => {
      setExpenses(data);
      setLoading(false);
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
  }, []);

  // Reset paid status when month changes
  useEffect(() => {
    setPaidIds(new Set());
  }, [currentDate]);

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const monthStart = startOfMonth(currentDate).toISOString();
  const monthEnd = endOfMonth(currentDate).toISOString();

  const isAll = activeBranchId === 'all';

  // Filter appointments for this month (completed or confirmed)
  const monthAppointments = appointments.filter(a =>
    (a.status === 'completed' || a.status === 'confirmed') &&
    a.date >= monthStart &&
    a.date <= monthEnd &&
    (isAll || !activeBranchId || a.locationId === activeBranchId || (!a.locationId && activeBranch?.isMain))
  );

  const monthTransactions = transactions.filter(t =>
    t.date >= monthStart &&
    t.date <= monthEnd &&
    (isAll || !activeBranchId || t.locationId === activeBranchId || (!t.locationId && activeBranch?.isMain))
  );

  const monthExpenses = expenses.filter(e =>
    e.date >= monthStart &&
    e.date <= monthEnd &&
    (isAll || !activeBranchId || e.locationId === activeBranchId || (!e.locationId && activeBranch?.isMain))
  );

  // Build per-professional summaries
  const summaries: ProfessionalSummary[] = professionals
    .map(pro => {
      const proApts = monthAppointments.filter(a => a.barberId === pro.uid);
      const proSales = monthTransactions.filter(t => t.barberId === pro.uid);
      
      const serviceGross = proSales.reduce((sum, t) => sum + (t.serviceAmount ?? 0), 0);
      const productGross = proSales.reduce((sum, t) => sum + (t.productAmount ?? 0), 0);
      const tipAmount = proSales.reduce((sum, t) => sum + (t.tipAmount ?? 0), 0);

      let serviceCommission = 0;
      let productCommission = 0;

      if (pro.paymentType === 'salary') {
        serviceCommission = (pro.salaryAmount ?? 0);
      } else {
        serviceCommission = serviceGross * ((pro.commissionRate ?? 0) / 100);
      }

      // Product commission applies regardless of salary/commission type for services
      productCommission = productGross * ((pro.productCommissionRate ?? 0) / 100);

      let totalAmount = serviceCommission + productCommission;

      // Add Management Bonus
      if (pro.isManager && pro.managerBonus) {
        totalAmount += pro.managerBonus;
      }

      return { 
        professional: pro, 
        appointmentsCount: proApts.length, 
        serviceGross, 
        productGross, 
        serviceCommission, 
        productCommission, 
        tipAmount, 
        totalAmount 
      };
    })
    // Show if they worked this month OR have fixed salary
    .filter(s => s.appointmentsCount > 0 || s.serviceGross > 0 || s.productGross > 0 || s.professional.paymentType === 'salary');

  const serviceRevenue = monthTransactions.reduce((sum, t) => sum + (t.serviceAmount ?? t.amount), 0);
  const productRevenue = monthTransactions.reduce((sum, t) => sum + (t.productAmount ?? 0), 0);
  const totalRevenue = serviceRevenue + productRevenue;
  const totalTips = monthTransactions.reduce((sum, t) => sum + (t.tipAmount ?? 0), 0);
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPayout = summaries.reduce((sum, s) => sum + s.totalAmount, 0);
  const profit = totalRevenue - totalPayout - totalExpenses;

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/[0.02] border border-white/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Serviços</p>
          <p className="text-xl font-black italic text-amber-500">R$ {serviceRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-gray-600 mt-1">{monthAppointments.length} apmts</p>
        </div>
        <div className="bg-white/[0.02] border border-white/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Produtos</p>
          <p className="text-xl font-black italic text-sky-500">R$ {productRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-gray-600 mt-1">Venda direta</p>
        </div>
        <div className="bg-white/[0.02] border border-white/10 p-4 border-b-red-500/50">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Despesas</p>
          <p className="text-xl font-black italic text-red-500">R$ {totalExpenses.toFixed(2)}</p>
          <p className="text-[10px] text-gray-600 mt-1">{monthExpenses.length} lançamentos</p>
        </div>
        <div className="bg-white/[0.02] border border-white/10 p-4 border-b-sky-400/50">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Payout</p>
          <p className="text-xl font-black italic text-white">R$ {totalPayout.toFixed(2)}</p>
          <p className="text-[10px] text-gray-600 mt-1">Comissões/Fixos</p>
        </div>
        <div className="bg-white/[0.02] border border-white/10 p-4 border-b-green-500/50 col-span-2 md:col-span-1">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Lucro Líquido</p>
          <p className={`text-2xl font-black italic ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            R$ {profit.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5 font-bold uppercase tracking-tighter">Real do Mês</p>
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
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Vendas (S/P)</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500 text-center">Gorjetas</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Cálculo Comissões</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500 text-right">Total a Pagar</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map(({ professional: pro, appointmentsCount, serviceGross, productGross, serviceCommission, productCommission, tipAmount, totalAmount }) => {
                  const isPaid = paidIds.has(pro.uid);
                  return (
                    <tr key={pro.uid} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="font-bold uppercase tracking-widest text-sm">{pro.name}</div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          {pro.paymentType === 'commission'
                            ? `Svc: ${pro.commissionRate ?? 0}% / Prod: ${pro.productCommissionRate ?? 0}%`
                            : `Fixo + ${pro.productCommissionRate ?? 0}% Prod`}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-[11px] font-bold text-gray-300">S: R$ {serviceGross.toFixed(2)}</div>
                        <div className="text-[11px] text-sky-400 font-bold">P: R$ {productGross.toFixed(2)}</div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-400 rounded-none text-[10px]">
                          R$ {tipAmount.toFixed(2)}
                        </Badge>
                      </td>
                      <td className="p-4 text-[10px] text-gray-500 space-y-1">
                        <div>
                          {pro.paymentType === 'commission'
                            ? `Svc: ${pro.commissionRate}% de R$ ${serviceGross.toFixed(2)} = R$ ${serviceCommission.toFixed(2)}`
                            : `Fixo: R$ ${serviceCommission.toFixed(2)}`}
                        </div>
                        {productCommission > 0 && (
                          <div className="text-sky-500">
                            Prod: {pro.productCommissionRate}% de R$ ${productGross.toFixed(2)} = R$ ${productCommission.toFixed(2)}
                          </div>
                        )}
                        {pro.isManager && pro.managerBonus && (
                          <div className="text-amber-500 font-bold">
                            + R$ {pro.managerBonus.toFixed(2)} (Bônus Gerência)
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
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
              {summaries.map(({ professional: pro, appointmentsCount, serviceGross, productGross, serviceCommission, productCommission, tipAmount, totalAmount }) => {
                const isPaid = paidIds.has(pro.uid);
                return (
                  <div key={pro.uid} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold uppercase tracking-widest text-sm">{pro.name}</div>
                        <div className="text-[9px] text-gray-500 mt-0.5 space-y-0.5">
                          <p>Svc: R$ {serviceGross.toFixed(2)} (R$ {serviceCommission.toFixed(2)})</p>
                          <p className="text-sky-400">Prod: R$ {productGross.toFixed(2)} (R$ {productCommission.toFixed(2)})</p>
                          <p className="text-sky-500 italic font-bold">Tips: R$ {tipAmount.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-500 font-black italic text-lg line-clamp-1">
                          R$ {totalAmount.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-tighter font-bold">Total a Pagar</div>
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
              <tr className="border-b border-white/10 bg-white/5 uppercase tracking-tighter text-[9px] text-gray-500 font-bold">
                <th className="p-3">Data</th>
                <th className="p-3">Cliente / Detalhes</th>
                {isAll && <th className="p-3">Unidade</th>}
                <th className="p-3">Profissional</th>
                <th className="p-3">Método</th>
                <th className="p-3 text-right">Serviço</th>
                <th className="p-3 text-right">Produtos</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {monthTransactions.sort((a,b) => b.date.localeCompare(a.date)).map(t => (
                <tr key={t.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-3 text-[10px] text-gray-500">{format(parseISO(t.date), 'dd/MM HH:mm')}</td>
                  <td className="p-3">
                    <div className="text-xs font-bold uppercase tracking-tight">{t.customerName}</div>
                    <div className="text-[9px] text-gray-500 uppercase italic">{t.serviceName}</div>
                    {t.products && t.products.length > 0 && (
                      <div className="text-[8px] text-amber-500/70 mt-0.5">
                        +{t.products.map(p => `${p.quantity}x ${p.name}`).join(', ')}
                      </div>
                    )}
                  </td>
                  {isAll && (
                    <td className="p-3 text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
                      {t.locationId ? 'Filial' : 'Matriz'}
                    </td>
                  )}
                  <td className="p-3 text-xs text-gray-500">{t.barberName}</td>
                  <td className="p-3">
                    <Badge className="bg-white/5 text-[9px] uppercase tracking-tighter border-white/10 text-gray-400">
                      {t.paymentMethod === 'cash' ? 'Dinheiro' : t.paymentMethod === 'card' ? 'Cartão' : t.paymentMethod === 'interac' ? 'Interac' : 'Outro'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right text-[11px] text-gray-400">R$ {(t.serviceAmount ?? t.amount).toFixed(2)}</td>
                  <td className="p-3 text-right text-[11px] text-sky-400">R$ {(t.productAmount ?? 0).toFixed(2)}</td>
                  <td className="p-3 text-right text-sm font-black italic text-amber-500">R$ {t.totalAmount.toFixed(2)}</td>
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

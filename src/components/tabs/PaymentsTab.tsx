import React, { useState, useEffect } from 'react';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Barber, Service, Appointment, Transaction, Expense } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, TrendingUp, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../AuthContext';
import { formatCurrency } from '../../lib/currency';
import { useLocationContext } from '../../LocationContext';

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

export const PaymentsTab: React.FC = () => {
  const { t } = useTranslation();
  const { profile, isAdmin } = useAuth();
  const { activeBranchId, activeBranch, networkConfig } = useLocationContext();
  const [professionals, setProfessionals] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const currencyCode = networkConfig.currency || 'BRL';
  const locale = networkConfig.language || 'pt-BR';

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

  const isBarber = profile?.role === 'barber';

  // Build per-professional summaries
  const summaries: ProfessionalSummary[] = (isBarber 
      ? professionals.filter(p => p.uid === profile?.uid)
      : professionals
    )
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
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPayout = summaries.reduce((sum, s) => sum + s.totalAmount, 0);
  const profit = totalRevenue - totalPayout - totalExpenses;

  // Filter transactions for specific professional if they are a barber
  const displayTransactions = isBarber 
    ? monthTransactions.filter(t => t.barberId === profile?.uid)
    : monthTransactions;

  const togglePaid = (uid: string) => {
    setPaidIds(prev => {
      const next = new Set(prev);
      const wasPaid = next.has(uid);
      if (wasPaid) next.delete(uid); else next.add(uid);
      toast.success(wasPaid ? t('financial.payment_unmarked') : t('financial.payment_success'));
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
          {format(currentDate, 'MMMM yyyy')}
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
      {!isBarber && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/[0.02] border border-white/10 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">{t('tabs.services')}</p>
            <p className="text-xl font-black italic text-amber-500">{formatCurrency(serviceRevenue, currencyCode, locale)}</p>
            <p className="text-[10px] text-gray-600 mt-1">{monthAppointments.length} apmts</p>
          </div>
          <div className="bg-white/[0.02] border border-white/10 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">{t('tabs.inventory')}</p>
            <p className="text-xl font-black italic text-sky-500">{formatCurrency(productRevenue, currencyCode, locale)}</p>
            <p className="text-[10px] text-gray-600 mt-1">{t('tabs.inventory')}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/10 p-4 border-b-red-500/50">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">{t('tabs.expenses')}</p>
            <p className="text-xl font-black italic text-red-500">{formatCurrency(totalExpenses, currencyCode, locale)}</p>
            <p className="text-[10px] text-gray-600 mt-1">{monthExpenses.length} lancs</p>
          </div>
          <div className="bg-white/[0.02] border border-white/10 p-4 border-b-sky-400/50">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Payout</p>
            <p className="text-xl font-black italic text-white">{formatCurrency(totalPayout, currencyCode, locale)}</p>
            <p className="text-[10px] text-gray-600 mt-1">{t('financial.commissions_salary')}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/10 p-4 border-b-green-500/50 col-span-2 md:col-span-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">{t('financial.net_profit')}</p>
            <p className={`text-2xl font-black italic ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(profit, currencyCode, locale)}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5 font-bold uppercase tracking-tighter">{t('financial.real_of_month')}</p>
          </div>
        </div>
      )}

      {/* Payments table */}
      <div className="bg-white/[0.02] border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 uppercase tracking-widest text-xs animate-pulse">
            {t('common.loading')}
          </div>
        ) : summaries.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 uppercase tracking-widest text-xs">
              {t('appointments.no_appointments')}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">{t('tabs.professionals')}</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Vendas (S/P)</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500 text-center">Gorjetas</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Cálculo Comissões</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500 text-right">{t('financial.payout')}</th>
                  <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500 text-right">{t('common.actions')}</th>
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
                        <div className="text-[11px] font-bold text-gray-300">S: {formatCurrency(serviceGross, currencyCode, locale)}</div>
                        <div className="text-[11px] text-sky-400 font-bold">P: {formatCurrency(productGross, currencyCode, locale)}</div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-400 rounded-none text-[10px]">
                          {formatCurrency(tipAmount, currencyCode, locale)}
                        </Badge>
                      </td>
                      <td className="p-4 text-[10px] text-gray-500 space-y-1">
                        <div>
                          {pro.paymentType === 'commission'
                            ? `Svc: ${pro.commissionRate}% ${t('common.of')} ${formatCurrency(serviceGross, currencyCode, locale)} = ${formatCurrency(serviceCommission, currencyCode, locale)}`
                            : `${t('professionals.salary')}: ${formatCurrency(serviceCommission, currencyCode, locale)}`}
                        </div>
                        {productCommission > 0 && (
                          <div className="text-sky-500">
                            Prod: {pro.productCommissionRate}% ${t('common.of')} ${formatCurrency(productGross, currencyCode, locale)} = ${formatCurrency(productCommission, currencyCode, locale)}
                          </div>
                        )}
                        {pro.isManager && pro.managerBonus && (
                          <div className="text-amber-500 font-bold">
                            + {formatCurrency(pro.managerBonus, currencyCode, locale)} ({t('professionals.manager_bonus')})
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-amber-500 font-black italic text-xl">
                          {formatCurrency(totalAmount, currencyCode, locale)}
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
                            <><Check className="h-3 w-3 mr-1.5" /> {t('financial.is_paid')}</>
                          ) : (
                            t('financial.mark_paid')
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
                          <p>Svc: {formatCurrency(serviceGross, currencyCode, locale)} ({formatCurrency(serviceCommission, currencyCode, locale)})</p>
                          <p className="text-sky-400">Prod: {formatCurrency(productGross, currencyCode, locale)} ({formatCurrency(productCommission, currencyCode, locale)})</p>
                          <p className="text-sky-500 italic font-bold">Tips: {formatCurrency(tipAmount, currencyCode, locale)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-500 font-black italic text-lg line-clamp-1">
                          {formatCurrency(totalAmount, currencyCode, locale)}
                        </div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-tighter font-bold">{t('financial.payout')}</div>
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
                      {isPaid ? <><Check className="h-3 w-3 mr-1.5" /> {t('financial.is_paid')}</> : t('financial.mark_paid')}
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
                <th className="p-3">{t('common.date')}</th>
                <th className="p-3">{t('tabs.clients')} / Detalhes</th>
                {isAll && <th className="p-3">{t('tabs.branches')}</th>}
                <th className="p-3">{t('tabs.professionals')}</th>
                <th className="p-3">Método</th>
                <th className="p-3 text-right">{t('tabs.services')}</th>
                <th className="p-3 text-right">{t('tabs.inventory')}</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayTransactions.sort((a,b) => b.date.localeCompare(a.date)).map(t_item => (
                <tr key={t_item.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-3 text-[10px] text-gray-500">{format(parseISO(t_item.date), 'dd/MM HH:mm')}</td>
                  <td className="p-3">
                    <div className="text-xs font-bold uppercase tracking-tight">{t_item.customerName}</div>
                    <div className="text-[9px] text-gray-500 uppercase italic">{t_item.serviceName}</div>
                    {t_item.products && t_item.products.length > 0 && (
                      <div className="text-[8px] text-amber-500/70 mt-0.5">
                        +{t_item.products.map(p => `${p.quantity}x ${p.name}`).join(', ')}
                      </div>
                    )}
                  </td>
                  {isAll && (
                    <td className="p-3 text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
                      {t_item.locationId ? 'Filial' : 'Matriz'}
                    </td>
                  )}
                  <td className="p-3 text-xs text-gray-500">{t_item.barberName}</td>
                  <td className="p-3">
                    <Badge className="bg-white/5 text-[9px] uppercase tracking-tighter border-white/10 text-gray-400">
                      {t_item.paymentMethod}
                    </Badge>
                  </td>
                  <td className="p-3 text-right text-[11px] text-gray-400">{formatCurrency((t_item.serviceAmount ?? t_item.amount), currencyCode, locale)}</td>
                  <td className="p-3 text-right text-[11px] text-sky-400">{formatCurrency((t_item.productAmount ?? 0), currencyCode, locale)}</td>
                  <td className="p-3 text-right text-sm font-black italic text-amber-500">{formatCurrency(t_item.totalAmount, currencyCode, locale)}</td>
                </tr>
              ))}
              {displayTransactions.length === 0 && (
                <tr>
                   <td colSpan={isAdmin ? 8 : 7} className="p-8 text-center text-gray-600 uppercase tracking-widest text-[10px]">{t('appointments.no_appointments')}</td>
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

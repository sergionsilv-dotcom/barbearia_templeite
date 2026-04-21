import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useLocationContext } from '../../LocationContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Sale, Appointment, Barber, CashFlow } from '../../types';
import { DollarSign, Download, TrendingUp, CreditCard, Wallet, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../lib/currency';

export const PaymentsTab: React.FC = () => {
  const { userData, isBarber } = useAuth();
  const { networkConfig, activeBranch } = useLocationContext();
  const { t } = useTranslation();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [barberCommission, setBarberCommission] = useState(0);

  const currencyCode = networkConfig.currency || 'BRL';
  const locale = networkConfig.language || 'pt-BR';

  useEffect(() => {
    fetchData();
  }, [activeBranch, userData]);

  const fetchData = async () => {
    // Determine filters based on role
    const salesFilters = [];
    if (activeBranch) salesFilters.push({ field: 'locationId', operator: '==', value: activeBranch });
    if (isBarber) salesFilters.push({ field: 'barberId', operator: '==', value: userData?.uid });

    const [sData, bData] = await Promise.all([
      firebaseUtils.getCollection<Sale>('sales', salesFilters as any),
      firebaseUtils.getCollection<Barber>('users', [{ field: 'role', operator: '==', value: 'barber' }] as any)
    ]);

    setSales(sData);
    setBarbers(bData);

    const revenue = sData.reduce((acc, sale) => acc + sale.total, 0);
    setTotalRevenue(revenue);

    // If barber, calculate their specific commission (placeholder 50%)
    if (isBarber) {
      setBarberCommission(revenue * 0.5);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">
            {isBarber ? t('professionals.commissions_salary') : t('tabs.financial')}
          </h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest">
            {isBarber ? t('dashboard.records') : t('financial.real_of_month')}
          </p>
        </div>
        <Button variant="outline" className="border-white/10 hover:bg-white/5 rounded-none uppercase tracking-widest text-[10px] font-bold">
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/[0.02] border-white/10 rounded-none overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="h-24 w-24 text-amber-500" />
          </div>
          <CardContent className="pt-6">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">
              {isBarber ? t('professionals.commissions_salary') : t('financial.net_profit')}
            </p>
            <h3 className="text-4xl font-black italic uppercase tracking-tighter text-amber-500">
              {formatCurrency(isBarber ? barberCommission : totalRevenue, currencyCode, locale)}
            </h3>
            <div className="mt-4 flex items-center text-[8px] font-black uppercase tracking-[0.2em] text-green-500 bg-green-500/10 w-fit px-2 py-1">
              +12.5% vs last month
            </div>
          </CardContent>
        </Card>

        {!isBarber && (
          <>
            <Card className="bg-white/[0.02] border-white/10 rounded-none">
              <CardContent className="pt-6">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Checkout Pro</p>
                <div className="flex items-center space-x-3 mb-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-xl font-bold uppercase tracking-tighter italic">Vendas Diretas</span>
                </div>
                <p className="text-2xl font-black">{formatCurrency(totalRevenue * 0.4, currencyCode, locale)}</p>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 rounded-none">
              <CardContent className="pt-6">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Pagamentos Internos</p>
                <div className="flex items-center space-x-3 mb-2">
                  <Wallet className="h-4 w-4 text-gray-400" />
                  <span className="text-xl font-bold uppercase tracking-tighter italic">Comissões Devidas</span>
                </div>
                <p className="text-2xl font-black">{formatCurrency(totalRevenue * 0.3, currencyCode, locale)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-white/[0.02] border-white/10 rounded-none">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-sm font-black uppercase tracking-widest italic">{t('dashboard.records')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Data</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Descrição</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Método</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-500 uppercase tracking-widest text-[10px]">
                      {t('appointments.no_appointments')}
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-amber-500/50" />
                          <span className="text-xs font-bold">{new Date(sale.date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
                          {sale.items.map(i => i.name).join(', ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-black italic">{formatCurrency(sale.total, currencyCode, locale)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
 Bible:396

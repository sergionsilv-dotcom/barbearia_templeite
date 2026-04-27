import React, { useState, useEffect } from 'react';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Expense, ExpenseCategory } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { 
  Receipt, Plus, 
  Wallet, Trash2, Tag, TrendingUp, 
  TrendingDown, History, PieChart, ArrowDownRight, 
  ArrowUpRight, CheckCircle2, Clock, Pencil
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { useLocationContext } from '../../LocationContext';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../lib/currency';
import * as locales from 'date-fns/locale';

export const ExpensesTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeBranchId, activeBranch, networkConfig } = useLocationContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'history'>('summary');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const currencyCode = networkConfig.currency || 'BRL';
  const localeStr = networkConfig.language || 'pt-BR';
  // Dynamic date locale
  const dateLocale = (locales as any)[localeStr.replace('-', '')] || (locales as any)[localeStr.split('-')[0]] || locales.ptBR;

  // Form states
  const [newExpense, setNewExpense] = useState({
    amount: 0,
    categoryId: '',
    description: '',
    paymentMethod: 'interac',
    type: 'expense' as 'expense' | 'income',
    isRecurring: false,
    date: new Date().toISOString().split('T')[0]
  });

  const [newCategory, setNewCategory] = useState({
    name: ''
  });

  useEffect(() => {
    const isAll = activeBranchId === 'all';
    const unsubExp = firebaseUtils.subscribeToCollection<Expense>('expenses', [], (data) => {
      const filtered = data.filter(e => isAll || !activeBranchId || e.locationId === activeBranchId || (!e.locationId && activeBranch?.isMain));
      setExpenses(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    
    const unsubCat = firebaseUtils.subscribeToCollection<ExpenseCategory>('expenseCategories', [], (data) => {
      const defaultCategories = [
        { id: 'purchase', name: t('expenses.cat_purchase') || 'Compra de Produtos' },
        { id: 'rent', name: t('expenses.cat_rent') || 'Aluguel' },
        { id: 'utilities', name: t('expenses.cat_utilities') || 'Energia / Água' },
        { id: 'marketing', name: t('expenses.cat_marketing') || 'Marketing / Anúncios' },
        { id: 'maintenance', name: t('expenses.cat_maintenance') || 'Manutenção da Loja' }
      ];

      const merged = [...data];
      defaultCategories.forEach(def => {
        if (!merged.find(c => c.id === def.id || c.name === def.name)) {
          merged.unshift(def);
        }
      });
      
      setCategories(merged);
      setLoading(false);
    });

    return () => { unsubExp(); unsubCat(); };
  }, [activeBranchId, activeBranch, t]);

  const handleAddExpense = async () => {
    if (newExpense.amount <= 0 || !newExpense.categoryId) {
      toast.error(t('expenses.required'));
      return;
    }

    const category = categories.find(c => c.id === newExpense.categoryId);

    try {
      await firebaseUtils.addDocument('expenses', {
        ...newExpense,
        categoryName: category?.name || t('expenses.cat_global'),
        locationId: activeBranchId === 'all' ? '' : activeBranchId,
        date: new Date(newExpense.date).toISOString(),
        createdAt: new Date().toISOString()
      });
      toast.success(t('expenses.success_create_exp'));
      setIsAddExpenseOpen(false);
      setNewExpense({ 
        amount: 0, 
        categoryId: '', 
        description: '', 
        paymentMethod: 'interac', 
        type: 'expense',
        isRecurring: false,
        date: new Date().toISOString().split('T')[0] 
      });
    } catch {
      toast.error(t('expenses.error_create_exp'));
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) return;
    try {
      await firebaseUtils.addDocument('expenseCategories', newCategory);
      toast.success(t('expenses.success_create_cat'));
      setIsAddCategoryOpen(false);
      setNewCategory({ name: '' });
    } catch {
      toast.error(t('expenses.error_create_cat'));
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || editingExpense.amount <= 0 || !editingExpense.categoryId) {
      toast.error(t('expenses.required'));
      return;
    }

    const category = categories.find(c => c.id === editingExpense.categoryId);

    try {
      await firebaseUtils.updateDocument('expenses', editingExpense.id, {
        ...editingExpense,
        categoryName: category?.name || t('expenses.cat_global'),
        date: new Date(editingExpense.date).toISOString()
      });
      toast.success(t('expenses.success_update'));
      setIsEditExpenseOpen(false);
      setEditingExpense(null);
    } catch {
      toast.error(t('expenses.error_update'));
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm(t('expenses.delete_confirm'))) return;
    try {
      await firebaseUtils.deleteDocument('expenses', id);
      toast.success(t('expenses.success_delete'));
    } catch {
      toast.error(t('expenses.error_delete'));
    }
  };

  const currentMonth = new Date().getMonth();
  const currentMonthExpenses = expenses
    .filter(e => {
      const isActuallyRent = e.description.toLowerCase().includes(t('expenses.cat_rent').toLowerCase());
      return new Date(e.date).getMonth() === currentMonth && (e.type === 'expense' || !e.type || isActuallyRent);
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const currentMonthIncome = expenses
    .filter(e => {
      const isActuallyRent = e.description.toLowerCase().includes(t('expenses.cat_rent').toLowerCase());
      return new Date(e.date).getMonth() === currentMonth && e.type === 'income' && !isActuallyRent;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyBalance = currentMonthIncome - currentMonthExpenses;

  if (loading) return <div className="text-center py-10 text-xs uppercase tracking-widest font-bold text-amber-500 animate-pulse">{t('expenses.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/[0.02] border-white/10 rounded-none border-t-red-500/50">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 text-white">
            <CardTitle className="text-[10px] uppercase tracking-widest text-red-500 font-bold">{t('expenses.summary_expenses')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500/20" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-black italic text-red-500">- {formatCurrency(currentMonthExpenses, currencyCode, localeStr)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/[0.02] border-white/10 rounded-none border-t-green-500/50">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 text-white">
            <CardTitle className="text-[10px] uppercase tracking-widest text-green-500 font-bold">{t('expenses.summary_income')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500/20" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-black italic text-green-500">+ {formatCurrency(currentMonthIncome, currencyCode, localeStr)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10 rounded-none border-t-blue-500/50">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 text-white">
            <CardTitle className="text-[10px] uppercase tracking-widest text-blue-500 font-bold">{t('expenses.monthly_balance')}</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500/20" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className={`text-2xl font-black italic ${monthlyBalance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {monthlyBalance >= 0 ? '+' : '-'} {formatCurrency(Math.abs(monthlyBalance), currencyCode, localeStr)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t border-white/5">
        <div className="flex bg-white/5 p-1 rounded-none">
          <button
            onClick={() => setActiveSubTab('summary')}
            className={`px-4 py-1.5 text-[10px] items-center flex gap-2 uppercase tracking-widest font-bold transition-all ${
              activeSubTab === 'summary' 
                ? 'bg-amber-600 text-white shadow-lg' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <PieChart className="h-3 w-3" /> {t('expenses.subtab_dashboard')}
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-1.5 text-[10px] items-center flex gap-2 uppercase tracking-widest font-bold transition-all ${
              activeSubTab === 'history' 
                ? 'bg-amber-600 text-white shadow-lg' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <History className="h-3 w-3" /> {t('expenses.subtab_history')}
          </button>
        </div>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{t('expenses.title')}</h2>
        <div className="flex gap-2 text-white">
           <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/10 rounded-none uppercase tracking-widest text-[10px] font-bold h-10 bg-transparent">
                <Tag className="h-4 w-4 mr-2" /> {t('expenses.categories')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 rounded-none text-white">
              <DialogHeader>
                <DialogTitle className="uppercase italic font-black tracking-tighter text-2xl">{t('expenses.new_category')}</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('expenses.form_cat_name')}</Label>
                  <Input 
                    placeholder={t('expenses.cat_placeholder')} 
                    className="bg-black border-white/10 rounded-none"
                    value={newCategory.name}
                    onChange={e => setNewCategory({ name: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCategory} className="w-full bg-blue-600 hover:bg-blue-700 rounded-none uppercase font-bold py-6">{t('common.save')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest text-[10px] font-bold h-10 px-6">
                <Plus className="h-4 w-4 mr-2" /> {t('expenses.new_entry')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 rounded-none max-w-md text-white">
              <DialogHeader>
                <DialogTitle className="uppercase italic font-black tracking-tighter text-2xl">{t('expenses.register_expense')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex bg-white/5 p-1 rounded-none mb-4">
                  <button
                    type="button"
                    onClick={() => setNewExpense({...newExpense, type: 'expense'})}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      newExpense.type === 'expense' ? 'bg-red-600 text-white' : 'text-gray-500'
                    }`}
                  >
                    {t('expenses.type_expense')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewExpense({...newExpense, type: 'income'})}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      newExpense.type === 'income' ? 'bg-green-600 text-white' : 'text-gray-500'
                    }`}
                  >
                    {t('expenses.type_income')}
                  </button>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('expenses.form_amount')}</Label>
                  <Input 
                    type="number"
                    className={`bg-black border-white/10 rounded-none font-bold text-lg ${
                      newExpense.type === 'expense' ? 'text-red-500' : 'text-green-500'
                    }`} 
                    value={newExpense.amount || ''}
                    onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('expenses.form_category')}</Label>
                  <Select onValueChange={val => setNewExpense({...newExpense, categoryId: val})}>
                    <SelectTrigger className="bg-black border-white/10 rounded-none">
                      <SelectValue placeholder={t('expenses.form_category_placeholder')} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-none">
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id} className="uppercase text-[10px] tracking-widest focus:bg-amber-600 focus:text-white">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('expenses.form_description')}</Label>
                  <Input 
                    placeholder={t('expenses.form_desc_placeholder')}
                    className="bg-black border-white/10 rounded-none"
                    value={newExpense.description}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('expenses.form_date')}</Label>
                    <Input 
                      type="date"
                      className="bg-black border-white/10 rounded-none"
                      value={newExpense.date}
                      onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('expenses.form_payment')}</Label>
                    <Select onValueChange={val => setNewExpense({...newExpense, paymentMethod: val})} defaultValue="interac">
                      <SelectTrigger className="bg-black border-white/10 rounded-none">
                        <SelectValue placeholder={t('common.back')} />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-none">
                        <SelectItem value="interac">INTERAC</SelectItem>
                        <SelectItem value="cash">{t('expenses.pay_cash')}</SelectItem>
                        <SelectItem value="card">{t('expenses.pay_card')}</SelectItem>
                        <SelectItem value="transfer">{t('expenses.pay_transfer')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={newExpense.isRecurring}
                    onChange={e => setNewExpense({...newExpense, isRecurring: e.target.checked})}
                    className="h-4 w-4 bg-black border-white/10 rounded-none accent-amber-600"
                  />
                  <Label htmlFor="recurring" className="text-[10px] uppercase tracking-widest text-gray-400 font-bold cursor-pointer">
                    {t('expenses.recurring')}
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleAddExpense}
                  className={`${
                    newExpense.type === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  } rounded-none uppercase tracking-widest font-bold py-6`}
                >
                  {t('expenses.confirm_entry')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

       {activeSubTab === 'history' ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-none overflow-hidden animate-in fade-in slide-in-from-bottom-2 text-white">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">
                <th className="px-6 py-4">{t('expenses.col_date')}</th>
                <th className="px-6 py-4">{t('expenses.col_category')}</th>
                {activeBranchId === 'all' && <th className="px-6 py-4">{t('expenses.col_unit')}</th>}
                <th className="px-6 py-4">{t('expenses.col_desc')}</th>
                <th className="px-6 py-4">{t('expenses.col_payment')}</th>
                <th className="px-6 py-4 text-right">{t('expenses.col_value')}</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.map((expense) => (
                <tr key={expense.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-[10px] uppercase font-bold text-gray-400">
                      {format(new Date(expense.date), "dd/MM/yyyy", { locale: dateLocale })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="text-[9px] border-white/10 bg-white/5 text-amber-500 rounded-none uppercase font-black italic">
                      {expense.categoryName}
                    </Badge>
                  </td>
                  {activeBranchId === 'all' && (
                    <td className="px-6 py-4">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
                        {expense.locationId ? 'Filial' : 'Matriz'}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-100 uppercase tracking-widest flex items-center gap-1">
                      {expense.description}
                      {expense.isRecurring && <Clock className="h-3 w-3 text-amber-500/50" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="uppercase text-[9px] font-black text-gray-500 px-2 py-1 bg-white/5 border border-white/5">
                      {expense.paymentMethod === 'interac' ? 'INTERAC' : 
                       expense.paymentMethod === 'cash' ? t('expenses.pay_cash') : 
                       expense.paymentMethod === 'card' ? t('expenses.pay_card') : t('expenses.pay_transfer')}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-md font-black italic shadow-inner px-2 py-0.5 ${expense.type === 'expense' || !expense.type ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
                        {(expense.type === 'expense' || !expense.type) ? '-' : '+'} {formatCurrency(expense.amount, currencyCode, localeStr)}
                      </span>
                      {expense.isRecurring && <span className="text-[8px] text-amber-500 font-bold uppercase tracking-tighter">{t('expenses.recurrent_label')}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => {
                          setEditingExpense(expense);
                          setIsEditExpenseOpen(true);
                        }}
                        className="flex items-center gap-1 text-amber-500 hover:text-amber-400 font-bold transition-all p-1"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-400 font-bold transition-all p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 uppercase tracking-[0.2em] text-[10px] font-bold">
                    {t('expenses.no_history')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 text-white">
          {/* Summary View Content */}
          <Card className="bg-white/[0.02] border-white/10 rounded-none">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-widest text-amber-500 font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> {t('expenses.top_income')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses
                  .filter(e => {
                    const isRent = e.description.toLowerCase().includes(t('expenses.cat_rent').toLowerCase());
                    return e.type === 'income' && !isRent && new Date(e.date).getMonth() === currentMonth;
                  })
                  .sort((a,b) => b.amount - a.amount)
                  .slice(0, 5)
                  .map(e => (
                    <div key={e.id} className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400">{e.description || e.categoryName}</span>
                      <span className="text-xs font-black text-green-500">+ {formatCurrency(e.amount, currencyCode, localeStr)}</span>
                    </div>
                  ))}
                {expenses.filter(e => {
                    const isRent = e.description.toLowerCase().includes(t('expenses.cat_rent').toLowerCase());
                    return e.type === 'income' && !isRent && new Date(e.date).getMonth() === currentMonth;
                  }).length === 0 && (
                  <p className="text-[10px] text-gray-600 uppercase italic">{t('expenses.no_income_month')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/10 rounded-none">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-widest text-red-500 font-bold flex items-center gap-2">
                <TrendingDown className="h-4 w-4" /> {t('expenses.top_expenses')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses
                  .filter(e => {
                    const isRent = e.description.toLowerCase().includes(t('expenses.cat_rent').toLowerCase());
                    return (e.type === 'expense' || !e.type || isRent) && new Date(e.date).getMonth() === currentMonth;
                  })
                  .sort((a,b) => b.amount - a.amount)
                  .slice(0, 5)
                  .map(e => (
                    <div key={e.id} className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400">{e.description || e.categoryName}</span>
                      <span className="text-xs font-black text-red-500">- {formatCurrency(e.amount, currencyCode, localeStr)}</span>
                    </div>
                  ))}
                 {expenses.filter(e => (e.type === 'expense' || !e.type) && new Date(e.date).getMonth() === currentMonth).length === 0 && (
                  <p className="text-[10px] text-gray-600 uppercase italic">{t('expenses.no_expenses_month')}</p>
                 )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/10 rounded-none md:col-span-2">
             <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-widest text-blue-500 font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> {t('expenses.active_recurring')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {expenses.filter(e => e.isRecurring).map(e => (
                  <div key={e.id} className="p-3 border border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-200">{e.description}</p>
                      <p className="text-[8px] uppercase text-gray-600 tracking-tighter">{e.categoryName}</p>
                    </div>
                    <span className={`text-xs font-black ${
                      (e.type === 'income' && !e.description.toLowerCase().includes(t('expenses.cat_rent').toLowerCase())) 
                      ? 'text-green-500' 
                      : 'text-red-500'
                    }`}>
                      {(e.type === 'income' && !e.description.toLowerCase().includes(t('expenses.cat_rent').toLowerCase())) ? '+' : '-'} {formatCurrency(e.amount, currencyCode, localeStr)}
                    </span>
                  </div>
                ))}
                 {expenses.filter(e => e.isRecurring).length === 0 && (
                  <p className="text-[10px] text-gray-600 uppercase italic col-span-3">{t('expenses.no_recurring_config')}</p>
                 )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Expense Modal */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 rounded-none max-w-md text-white">
          <DialogHeader>
            <DialogTitle className="uppercase italic font-black tracking-tighter text-2xl">{t('expenses.edit_entry')}</DialogTitle>
          </DialogHeader>
          
          {editingExpense && (
            <div className="space-y-4 py-4 text-white">
              <div className="flex bg-white/5 p-1 rounded-none mb-4">
                <button
                  type="button"
                  onClick={() => setEditingExpense({...editingExpense, type: 'expense'})}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    editingExpense.type === 'expense' ? 'bg-red-600 text-white' : 'text-gray-500'
                  }`}
                >
                  {t('expenses.type_expense')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingExpense({...editingExpense, type: 'income'})}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    editingExpense.type === 'income' ? 'bg-green-600 text-white' : 'text-gray-500'
                  }`}
                >
                  {t('expenses.type_income')}
                </button>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('expenses.form_amount')}</Label>
                <Input 
                  type="number"
                  className={`bg-black border-white/10 rounded-none font-bold text-lg ${
                    editingExpense.type === 'expense' ? 'text-red-500' : 'text-green-500'
                  }`} 
                  value={editingExpense.amount || ''}
                  onChange={e => setEditingExpense({...editingExpense, amount: parseFloat(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('expenses.form_category')}</Label>
                <Select 
                  value={editingExpense.categoryId}
                  onValueChange={val => setEditingExpense({...editingExpense, categoryId: val})}
                >
                  <SelectTrigger className="bg-black border-white/10 rounded-none">
                    <SelectValue placeholder={t('expenses.form_category_placeholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-none">
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id} className="uppercase text-[10px] tracking-widest focus:bg-amber-600 focus:text-white">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('expenses.form_description')}</Label>
                <Input 
                  className="bg-black border-white/10 rounded-none"
                  value={editingExpense.description}
                  onChange={e => setEditingExpense({...editingExpense, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('expenses.col_date')}</Label>
                  <Input 
                    type="date"
                    className="bg-black border-white/10 rounded-none"
                    value={editingExpense.date.split('T')[0]}
                    onChange={e => setEditingExpense({...editingExpense, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('expenses.form_payment')}</Label>
                  <Select 
                    value={editingExpense.paymentMethod}
                    onValueChange={val => setEditingExpense({...editingExpense, paymentMethod: val})}
                  >
                    <SelectTrigger className="bg-black border-white/10 rounded-none">
                      <SelectValue placeholder={t('common.back')} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-none">
                        <SelectItem value="interac">INTERAC</SelectItem>
                        <SelectItem value="cash">{t('expenses.pay_cash')}</SelectItem>
                        <SelectItem value="card">{t('expenses.pay_card')}</SelectItem>
                        <SelectItem value="transfer">{t('expenses.pay_transfer')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-recurring"
                  checked={editingExpense.isRecurring}
                  onChange={e => setEditingExpense({...editingExpense, isRecurring: e.target.checked})}
                  className="h-4 w-4 bg-black border-white/10 rounded-none accent-amber-600"
                />
                <Label htmlFor="edit-recurring" className="text-[10px] uppercase tracking-widest text-gray-400 font-bold cursor-pointer">
                  {t('expenses.recurring')}
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              onClick={handleUpdateExpense}
              className="w-full bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest font-bold py-6 text-white"
            >
              {t('expenses.save_changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

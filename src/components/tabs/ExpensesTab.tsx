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
  Receipt, Plus, Filter, Calendar as CalendarIcon, 
  Wallet, FileText, Trash2, Tag, TrendingUp, 
  TrendingDown, History, PieChart, ArrowDownRight, 
  ArrowUpRight, CheckCircle2, Clock, Pencil
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../ui/badge';

import { useLocationContext } from '../../LocationContext';

export const ExpensesTab: React.FC = () => {
  const { activeBranchId, activeBranch } = useLocationContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'history'>('summary');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

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
        { id: 'purchase', name: 'Compra de Produtos' },
        { id: 'rent', name: 'Aluguel' },
        { id: 'utilities', name: 'Energia / Água' },
        { id: 'marketing', name: 'Marketing / Anúncios' },
        { id: 'maintenance', name: 'Manutenção da Loja' }
      ];

      // Merge defaults with user categories, avoiding duplicates
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
  }, [activeBranchId, activeBranch]);

  const handleAddExpense = async () => {
    if (newExpense.amount <= 0 || !newExpense.categoryId) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    const category = categories.find(c => c.id === newExpense.categoryId);

    try {
      await firebaseUtils.addDocument('expenses', {
        ...newExpense,
        categoryName: category?.name || 'Geral',
        locationId: activeBranchId === 'all' ? '' : activeBranchId,
        date: new Date(newExpense.date).toISOString(),
        createdAt: new Date().toISOString()
      });
      toast.success('Despesa lançada com sucesso!');
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
      toast.error('Erro ao lançar despesa.');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) return;
    try {
      await firebaseUtils.addDocument('expenseCategories', newCategory);
      toast.success('Categoria adicionada!');
      setIsAddCategoryOpen(false);
      setNewCategory({ name: '' });
    } catch {
      toast.error('Erro ao adicionar categoria.');
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || editingExpense.amount <= 0 || !editingExpense.categoryId) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    const category = categories.find(c => c.id === editingExpense.categoryId);

    try {
      await firebaseUtils.updateDocument('expenses', editingExpense.id, {
        ...editingExpense,
        categoryName: category?.name || 'Geral',
        date: new Date(editingExpense.date).toISOString()
      });
      toast.success('Lançamento atualizado!');
      setIsEditExpenseOpen(false);
      setEditingExpense(null);
    } catch {
      toast.error('Erro ao atualizar lançamento.');
    }
  };

  // Auto-correction logic for "Aluguel"
  useEffect(() => {
    if (newExpense.description.toLowerCase().includes('aluguel')) {
      const rentCat = categories.find(c => c.name.toLowerCase().includes('aluguel'));
      if (rentCat) {
        setNewExpense(prev => ({ ...prev, categoryId: rentCat.id, type: 'expense' }));
      }
    }
  }, [newExpense.description, categories]);

  useEffect(() => {
    if (editingExpense && editingExpense.description.toLowerCase().includes('aluguel')) {
      const rentCat = categories.find(c => c.name.toLowerCase().includes('aluguel'));
      if (rentCat) {
        setEditingExpense(prev => prev ? ({ ...prev, categoryId: rentCat.id, type: 'expense' }) : null);
      }
    }
  }, [editingExpense?.description, categories]);

  const deleteExpense = async (id: string) => {
    if (!confirm('Deseja excluir esta despesa?')) return;
    try {
      await firebaseUtils.deleteDocument('expenses', id);
      toast.success('Despesa excluída.');
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  const currentMonth = new Date().getMonth();
  const currentMonthExpenses = expenses
    .filter(e => {
      const isActuallyRent = e.description.toLowerCase().includes('aluguel');
      return new Date(e.date).getMonth() === currentMonth && (e.type === 'expense' || !e.type || isActuallyRent);
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const currentMonthIncome = expenses
    .filter(e => {
      const isActuallyRent = e.description.toLowerCase().includes('aluguel');
      return new Date(e.date).getMonth() === currentMonth && e.type === 'income' && !isActuallyRent;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyBalance = currentMonthIncome - currentMonthExpenses;

  if (loading) return <div className="text-center py-10 text-xs uppercase tracking-widest font-bold text-amber-500 animate-pulse">Carregando financeiro...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/[0.02] border-white/10 rounded-none border-t-red-500/50">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Resumo Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500/20" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-black italic text-red-500">- R$ {currentMonthExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/[0.02] border-white/10 rounded-none border-t-green-500/50">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] uppercase tracking-widest text-green-500 font-bold">Resumo Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500/20" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-black italic text-green-500">+ R$ {currentMonthIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10 rounded-none border-t-blue-500/50">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] uppercase tracking-widest text-blue-500 font-bold">Saldo Mensal</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500/20" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className={`text-2xl font-black italic ${monthlyBalance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {monthlyBalance >= 0 ? '+' : '-'} R$ {Math.abs(monthlyBalance).toFixed(2)}
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
            <PieChart className="h-3 w-3" /> Dashboard
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-1.5 text-[10px] items-center flex gap-2 uppercase tracking-widest font-bold transition-all ${
              activeSubTab === 'history' 
                ? 'bg-amber-600 text-white shadow-lg' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <History className="h-3 w-3" /> Histórico
          </button>
        </div>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Fluxo de Caixa / Despesas</h2>
        <div className="flex gap-2">
           <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/10 rounded-none uppercase tracking-widest text-[10px] font-bold h-10">
                <Tag className="h-4 w-4 mr-2" /> Categorias
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 rounded-none">
              <DialogHeader>
                <DialogTitle className="uppercase italic font-black tracking-tighter text-2xl">Nova Categoria</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Nome da Categoria</Label>
                  <Input 
                    placeholder="Ex: Aluguel, Luz, Marketing..." 
                    className="bg-black border-white/10 rounded-none"
                    value={newCategory.name}
                    onChange={e => setNewCategory({ name: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCategory} className="w-full bg-blue-600 hover:bg-blue-700 rounded-none uppercase font-bold py-6">Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest text-[10px] font-bold h-10 px-6">
                <Plus className="h-4 w-4 mr-2" /> Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 rounded-none max-w-md">
              <DialogHeader>
                <DialogTitle className="uppercase italic font-black tracking-tighter text-2xl">Registrar Gasto</DialogTitle>
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
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewExpense({...newExpense, type: 'income'})}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      newExpense.type === 'income' ? 'bg-green-600 text-white' : 'text-gray-500'
                    }`}
                  >
                    Receita
                  </button>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Valor (R$)</Label>
                  <Input 
                    type="number"
                    className={`bg-black border-white/10 rounded-none font-bold text-lg ${
                      newExpense.type === 'expense' ? 'text-red-500' : 'text-green-500'
                    }`} 
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Categoria</Label>
                  <Select onValueChange={val => setNewExpense({...newExpense, categoryId: val})}>
                    <SelectTrigger className="bg-black border-white/10 rounded-none">
                      <SelectValue placeholder="Selecione a categoria" />
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
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Descrição</Label>
                  <Input 
                    placeholder="Ex: Pagamento referente ao mês de Abril"
                    className="bg-black border-white/10 rounded-none"
                    value={newExpense.description}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Data do Gasto</Label>
                    <Input 
                      type="date"
                      className="bg-black border-white/10 rounded-none"
                      value={newExpense.date}
                      onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Forma de Pagto.</Label>
                    <Select onValueChange={val => setNewExpense({...newExpense, paymentMethod: val})} defaultValue="interac">
                      <SelectTrigger className="bg-black border-white/10 rounded-none">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-none">
                        <SelectItem value="interac">INTERAC</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="card">Cartão</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
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
                    Lançamento Recorrente? (Mensal)
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
                  Confirmar Lançamento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

       {activeSubTab === 'history' ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-none overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Categoria</th>
                {activeBranchId === 'all' && <th className="px-6 py-4">Unidade</th>}
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Forma de Pagto.</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.map((expense) => (
                <tr key={expense.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-[10px] uppercase font-bold text-gray-400">
                      {format(new Date(expense.date), "dd/MM/yyyy", { locale: ptBR })}
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
                       expense.paymentMethod === 'cash' ? 'DINHEIRO' : 
                       expense.paymentMethod === 'card' ? 'CARTÃO' : 'TRANSF.'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-md font-black italic shadow-inner px-2 py-0.5 ${expense.type === 'expense' || !expense.type ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
                        {(expense.type === 'expense' || !expense.type) ? '-' : '+'} R$ {expense.amount.toFixed(2)}
                      </span>
                      {expense.isRecurring && <span className="text-[8px] text-amber-500 font-bold uppercase tracking-tighter">Recorrente</span>}
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
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="text-[8px] uppercase tracking-tighter">Editar</span>
                      </button>
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-400 font-bold transition-all p-1"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-[8px] uppercase tracking-tighter">Excluir</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 uppercase tracking-[0.2em] text-[10px] font-bold">
                    Nenhum lançamento no histórico
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
          {/* Summary View Content */}
          <Card className="bg-white/[0.02] border-white/10 rounded-none">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-widest text-amber-500 font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Maiores Entradas (Mês)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses
                  .filter(e => {
                    const isRent = e.description.toLowerCase().includes('aluguel');
                    return e.type === 'income' && !isRent && new Date(e.date).getMonth() === currentMonth;
                  })
                  .sort((a,b) => b.amount - a.amount)
                  .slice(0, 5)
                  .map(e => (
                    <div key={e.id} className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400">{e.description || e.categoryName}</span>
                      <span className="text-xs font-black text-green-500">+ R$ {e.amount.toFixed(2)}</span>
                    </div>
                  ))}
                {expenses.filter(e => {
                    const isRent = e.description.toLowerCase().includes('aluguel');
                    return e.type === 'income' && !isRent && new Date(e.date).getMonth() === currentMonth;
                  }).length === 0 && (
                  <p className="text-[10px] text-gray-600 uppercase italic">Nenhuma receita este mês</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/10 rounded-none">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-widest text-red-500 font-bold flex items-center gap-2">
                <TrendingDown className="h-4 w-4" /> Maiores Gastos (Mês)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses
                  .filter(e => {
                    const isRent = e.description.toLowerCase().includes('aluguel');
                    return (e.type === 'expense' || !e.type || isRent) && new Date(e.date).getMonth() === currentMonth;
                  })
                  .sort((a,b) => b.amount - a.amount)
                  .slice(0, 5)
                  .map(e => (
                    <div key={e.id} className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400">{e.description || e.categoryName}</span>
                      <span className="text-xs font-black text-red-500">- R$ {e.amount.toFixed(2)}</span>
                    </div>
                  ))}
                 {expenses.filter(e => (e.type === 'expense' || !e.type) && new Date(e.date).getMonth() === currentMonth).length === 0 && (
                  <p className="text-[10px] text-gray-600 uppercase italic">Nenhum gasto este mês</p>
                 )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/10 rounded-none md:col-span-2">
             <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-widest text-blue-500 font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Lançamentos Recorrentes Ativos
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
                      (e.type === 'income' && !e.description.toLowerCase().includes('aluguel')) 
                      ? 'text-green-500' 
                      : 'text-red-500'
                    }`}>
                      {(e.type === 'income' && !e.description.toLowerCase().includes('aluguel')) ? '+' : '-'} R$ {e.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                 {expenses.filter(e => e.isRecurring).length === 0 && (
                  <p className="text-[10px] text-gray-600 uppercase italic col-span-3">Nenhum lançamento recorrente configurado</p>
                 )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Expense Modal */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase italic font-black tracking-tighter text-2xl">Editar Lançamento</DialogTitle>
          </DialogHeader>
          
          {editingExpense && (
            <div className="space-y-4 py-4">
              <div className="flex bg-white/5 p-1 rounded-none mb-4">
                <button
                  type="button"
                  onClick={() => setEditingExpense({...editingExpense, type: 'expense'})}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    editingExpense.type === 'expense' ? 'bg-red-600 text-white' : 'text-gray-500'
                  }`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setEditingExpense({...editingExpense, type: 'income'})}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    editingExpense.type === 'income' ? 'bg-green-600 text-white' : 'text-gray-500'
                  }`}
                >
                  Receita
                </button>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Valor (R$)</Label>
                <Input 
                  type="number"
                  className={`bg-black border-white/10 rounded-none font-bold text-lg ${
                    editingExpense.type === 'expense' ? 'text-red-500' : 'text-green-500'
                  }`} 
                  value={editingExpense.amount}
                  onChange={e => setEditingExpense({...editingExpense, amount: parseFloat(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Categoria</Label>
                <Select 
                  value={editingExpense.categoryId}
                  onValueChange={val => setEditingExpense({...editingExpense, categoryId: val})}
                >
                  <SelectTrigger className="bg-black border-white/10 rounded-none">
                    <SelectValue placeholder="Selecione a categoria" />
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
                <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Descrição</Label>
                <Input 
                  className="bg-black border-white/10 rounded-none"
                  value={editingExpense.description}
                  onChange={e => setEditingExpense({...editingExpense, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Data</Label>
                  <Input 
                    type="date"
                    className="bg-black border-white/10 rounded-none"
                    value={editingExpense.date.split('T')[0]}
                    onChange={e => setEditingExpense({...editingExpense, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Pagamento</Label>
                  <Select 
                    value={editingExpense.paymentMethod}
                    onValueChange={val => setEditingExpense({...editingExpense, paymentMethod: val})}
                  >
                    <SelectTrigger className="bg-black border-white/10 rounded-none">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-none">
                      <SelectItem value="interac">INTERAC</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
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
                  Lançamento Recorrente?
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              onClick={handleUpdateExpense}
              className="w-full bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest font-bold py-6"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

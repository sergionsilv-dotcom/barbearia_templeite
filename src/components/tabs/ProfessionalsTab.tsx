import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Barber } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Scissors, Percent, DollarSign, TrendingUp, Store, Building2 } from 'lucide-react';
import { useLocationContext } from '../../LocationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const emptyPro = (): Omit<Barber, 'uid'> => ({
  name: '',
  bio: '',
  role: 'barber',
  specialties: [],
  paymentType: 'commission',
  commissionRate: 40,
  productCommissionRate: 10,
  salaryAmount: 0,
  isManager: false,
  managerBonus: 0,
  location: '',
  locationId: '',
});

export const ProfessionalsTab: React.FC<{ activeBranchId?: string | null }> = ({ activeBranchId }) => {
  const { branches, activeBranch } = useLocationContext();
  const [professionals, setProfessionals] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [form, setForm] = useState<Omit<Barber, 'uid'>>(emptyPro());
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = firebaseUtils.subscribeToCollection<Barber>('users', [], (data) => {
      const isAll = activeBranchId === 'all';
      const filtered = data.filter(u => 
        (u.role === 'barber' || u.role === 'admin' || u.role === 'manager') &&
        (isAll || !activeBranchId || u.locationId === activeBranchId || (!u.locationId && activeBranch?.isMain))
      );
      setProfessionals(filtered.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });
    return () => unsub();
  }, [activeBranchId, activeBranch]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyPro());
    setSpecialtyInput('');
    setModalOpen(true);
  };

  const openEdit = (pro: Barber) => {
    setEditing(pro);
    setForm({
      name: pro.name,
      bio: pro.bio || '',
      role: pro.role,
      specialties: pro.specialties || [],
      paymentType: pro.paymentType || 'commission',
      commissionRate: pro.commissionRate ?? 40,
      productCommissionRate: pro.productCommissionRate ?? 10,
      salaryAmount: pro.salaryAmount ?? 0,
      isManager: pro.isManager ?? false,
      managerBonus: pro.managerBonus ?? 0,
      location: pro.location || '',
      locationId: pro.locationId || '',
    });
    setSpecialtyInput('');
    setModalOpen(true);
  };

  const addSpecialty = () => {
    const s = specialtyInput.trim();
    if (!s) return;
    setForm(f => ({ ...f, specialties: [...(f.specialties || []), s] }));
    setSpecialtyInput('');
  };

  const removeSpecialty = (i: number) => {
    setForm(f => ({ ...f, specialties: f.specialties?.filter((_, idx) => idx !== i) }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await firebaseUtils.updateDocument<Barber>('users', editing.uid, form);
        toast.success('Profissional atualizado!');
      } else {
        const id = `pro_${Date.now()}`;
        const newPro: Barber = { uid: id, ...form };
        await setDoc(doc(db, 'users', id), newPro);
        toast.success('Profissional cadastrado!');
      }
      setModalOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar profissional');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!window.confirm('Excluir este profissional?')) return;
    try {
      await firebaseUtils.deleteDocument('users', uid);
      toast.success('Profissional excluído');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={openAdd}
          className="bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest text-xs font-bold"
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Profissional
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 uppercase tracking-widest text-xs animate-pulse">
          Carregando...
        </div>
      ) : professionals.length === 0 ? (
        <div className="p-12 text-center text-gray-500 uppercase tracking-widest text-xs">
          Nenhum profissional cadastrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map(pro => (
            <div
              key={pro.uid}
              className="bg-white/[0.02] border border-white/10 p-6 space-y-4 hover:border-amber-500/30 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Scissors className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-widest text-sm leading-tight">{pro.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="rounded-none text-[10px] uppercase tracking-widest bg-white/5 text-gray-500 border-white/10">
                        {pro.role}
                      </Badge>
                      {pro.isManager && (
                        <Badge className="rounded-none text-[10px] boder-amber-500/20 bg-amber-500/10 text-amber-500 uppercase tracking-widest font-black italic">
                          GERENTE
                        </Badge>
                      )}
                      {pro.location && (
                        <Badge variant="outline" className="rounded-none text-[10px] border-white/5 bg-white/5 text-gray-500 uppercase tracking-widest">
                          {pro.location}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                  <Button
                    size="icon" variant="ghost"
                    className="h-7 w-7 text-amber-500 hover:bg-amber-500/10"
                    onClick={() => openEdit(pro)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon" variant="ghost"
                    className="h-7 w-7 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleDelete(pro.uid)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Bio */}
              {pro.bio && (
                <p className="text-xs text-gray-500 leading-relaxed">{pro.bio}</p>
              )}

              {/* Specialties */}
              {pro.specialties && pro.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pro.specialties.map((s, i) => (
                    <span
                      key={i}
                      className="text-[10px] uppercase tracking-widest bg-white/5 px-2 py-0.5 text-gray-400 border border-white/5"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Payment type */}
              <div className="pt-3 border-t border-white/5">
                {pro.paymentType === 'commission' ? (
                  <div className="flex flex-col gap-1 text-xs text-amber-500 font-bold uppercase tracking-widest">
                    <div className="flex items-center">
                      <Percent className="h-3 w-3 mr-1.5" />
                      {pro.commissionRate ?? 0}% Comissão (Serviços)
                    </div>
                    <div className="flex items-center text-sky-500">
                      <TrendingUp className="h-3 w-3 mr-1.5" />
                      {pro.productCommissionRate ?? 0}% Comissão (Produtos)
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 text-xs text-green-400 font-bold uppercase tracking-widest">
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1.5" />
                      R$ {(pro.salaryAmount ?? 0).toFixed(2)} / mês
                    </div>
                    {pro.productCommissionRate && pro.productCommissionRate > 0 && (
                      <div className="flex items-center text-sky-500">
                        <TrendingUp className="h-3 w-3 mr-1.5" />
                        {pro.productCommissionRate}% Comissão (Produtos)
                      </div>
                    )}
                  </div>
                )}
                {pro.isManager && (pro.managerBonus ?? 0) > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/[0.03] flex items-center text-[10px] text-amber-500/80 font-bold uppercase tracking-widest">
                    <TrendingUp className="h-3 w-3 mr-1.5" />
                    + R$ {pro.managerBonus?.toFixed(2)} Gratificação Gerência
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#111] border-white/10 rounded-none text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-bold text-base">
              {editing ? 'Editar Profissional' : 'Novo Profissional'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Nome *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                placeholder="Nome completo"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Bio / Apresentação</Label>
              <textarea
                value={form.bio || ''}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-none p-3 text-sm text-white resize-none h-16 focus:outline-none focus:border-amber-500 placeholder:text-gray-600"
                placeholder="Breve descrição do profissional..."
              />
            </div>

            {/* Especialidades */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Especialidades</Label>
              <div className="flex gap-2">
                <Input
                  value={specialtyInput}
                  onChange={e => setSpecialtyInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpecialty(); } }}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="Ex: Corte degradê"
                />
                <Button
                  type="button"
                  onClick={addSpecialty}
                  variant="outline"
                  className="border-white/10 rounded-none px-3 flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {(form.specialties || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(form.specialties || []).map((s, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest bg-white/5 px-2 py-1 text-gray-400 border border-white/10"
                    >
                      {s}
                      <button
                        onClick={() => removeSpecialty(i)}
                        className="text-red-400 hover:text-red-300 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tipo de Pagamento */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Tipo de Pagamento</Label>
              <div className="flex gap-0">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, paymentType: 'commission' }))}
                  className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-bold border transition-colors ${
                    form.paymentType === 'commission'
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  <Percent className="h-3 w-3 inline mr-1" /> Comissão
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, paymentType: 'salary' }))}
                  className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-bold border-t border-b border-r transition-colors ${
                    form.paymentType === 'salary'
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  <DollarSign className="h-3 w-3 inline mr-1" /> Salário Fixo
                </button>
              </div>
            </div>

            {/* Valor */}
            {form.paymentType === 'commission' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">
                    Comissão Serviços (%)
                  </Label>
                  <Input
                    type="number" min="0" max="100"
                    value={form.commissionRate ?? ''}
                    onChange={e => setForm(f => ({ ...f, commissionRate: Number(e.target.value) }))}
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                    placeholder="Ex: 40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">
                    Comissão Produtos (%)
                  </Label>
                  <Input
                    type="number" min="0" max="100"
                    value={form.productCommissionRate ?? ''}
                    onChange={e => setForm(f => ({ ...f, productCommissionRate: Number(e.target.value) }))}
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                    placeholder="Ex: 10"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">
                    Salário Mensal (R$)
                  </Label>
                  <Input
                    type="number" min="0" step="50"
                    value={form.salaryAmount ?? ''}
                    onChange={e => setForm(f => ({ ...f, salaryAmount: Number(e.target.value) }))}
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                    placeholder="Ex: 2500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">
                    Comissão Produtos (%)
                  </Label>
                  <Input
                    type="number" min="0" max="100"
                    value={form.productCommissionRate ?? ''}
                    onChange={e => setForm(f => ({ ...f, productCommissionRate: Number(e.target.value) }))}
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                    placeholder="Ex: 10"
                  />
                </div>
              </div>
            )}

            {/* Gerência */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs uppercase tracking-widest text-amber-500 font-bold">Acúmulo de Função: Gerência</Label>
                  <p className="text-[10px] text-gray-600 uppercase">Habilita bônus fixo mensal</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isManager}
                  onChange={e => setForm(f => ({ ...f, isManager: e.target.checked }))}
                  className="h-4 w-4 rounded-none bg-white/5 border-white/10 text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
              </div>

              {form.isManager && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">
                    Bônus de Gerência (R$ fixo)
                  </Label>
                  <Input
                    type="number" min="0" step="50"
                    value={form.managerBonus ?? ''}
                    onChange={e => setForm(f => ({ ...f, managerBonus: Number(e.target.value) }))}
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                    placeholder="Ex: 500"
                  />
                  <p className="text-[10px] text-gray-600 italic">
                    Este valor será SOMADO à comissão ou salário no financeiro.
                  </p>
                </div>
              )}
            </div>

            {/* Unidade / Loja */}
            <div className="space-y-2 pt-4 border-t border-white/5">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Unidade / Loja de Atuação</Label>
              <Select 
                value={form.locationId || 'all'} 
                onValueChange={(val) => {
                  const b = branches.find(x => x.id === val);
                  setForm(f => ({ 
                    ...f, 
                    locationId: val === 'all' ? '' : val,
                    location: b ? b.name : '' 
                  }));
                }}
              >
                <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-10 uppercase tracking-widest text-[10px]">
                  <SelectValue placeholder="Todas as Unidades (Global)" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-white/10 text-white rounded-none">
                  <SelectItem value="all" className="uppercase tracking-widest text-[10px]">Todas as Unidades (Global)</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id} className="uppercase tracking-widest text-[10px]">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-gray-600 uppercase">Selecione a unidade principal deste profissional.</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-white/10 rounded-none uppercase tracking-widest text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest text-xs font-bold"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

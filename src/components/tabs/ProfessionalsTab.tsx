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
import { Plus, Edit2, Trash2, Scissors, Percent, DollarSign } from 'lucide-react';

const emptyPro = (): Omit<Barber, 'uid'> => ({
  name: '',
  bio: '',
  role: 'barber',
  specialties: [],
  paymentType: 'commission',
  commissionRate: 40,
  salaryAmount: 0,
});

export const ProfessionalsTab: React.FC = () => {
  const [professionals, setProfessionals] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [form, setForm] = useState<Omit<Barber, 'uid'>>(emptyPro());
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = firebaseUtils.subscribeToCollection<Barber>('users', [], (data) => {
      setProfessionals(data.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

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
      salaryAmount: pro.salaryAmount ?? 0,
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
                    <Badge className="rounded-none text-[10px] uppercase tracking-widest mt-1 bg-white/5 text-gray-500 border-white/10">
                      {pro.role}
                    </Badge>
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
                  <div className="flex items-center text-xs text-amber-500 font-bold uppercase tracking-widest">
                    <Percent className="h-3 w-3 mr-1.5" />
                    {pro.commissionRate ?? 0}% Comissão por serviço
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-green-400 font-bold uppercase tracking-widest">
                    <DollarSign className="h-3 w-3 mr-1.5" />
                    R$ {(pro.salaryAmount ?? 0).toFixed(2)} / mês
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
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-400">
                  Taxa de Comissão (%)
                </Label>
                <Input
                  type="number" min="0" max="100"
                  value={form.commissionRate ?? ''}
                  onChange={e => setForm(f => ({ ...f, commissionRate: Number(e.target.value) }))}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="Ex: 40"
                />
                <p className="text-xs text-gray-600">
                  Ex: 40% → a cada R$100 em serviços, recebe R$40
                </p>
              </div>
            ) : (
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
            )}
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

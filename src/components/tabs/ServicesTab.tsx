import React, { useState, useEffect } from 'react';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Service } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { useAuth } from '../../AuthContext';

const emptyService = (): Omit<Service, 'id'> => ({
  name: '',
  description: '',
  price: 0,
  duration: 30,
});

export const ServicesTab: React.FC = () => {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<Omit<Service, 'id'>>(emptyService());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = firebaseUtils.subscribeToCollection<Service>('services', [], (data) => {
      setServices(data.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isAdmin = profile?.role === 'admin';

  const openAdd = () => {
    setEditing(null);
    setForm(emptyService());
    setModalOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditing(svc);
    setForm({
      name: svc.name,
      description: svc.description || '',
      price: svc.price,
      duration: svc.duration,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.price <= 0) {
      toast.error('Nome e preço são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await firebaseUtils.updateDocument<Service>('services', editing.id, form);
        toast.success('Serviço atualizado!');
      } else {
        await firebaseUtils.addDocument('services', form);
        toast.success('Serviço criado!');
      }
      setModalOpen(false);
    } catch {
      toast.error('Erro ao salvar serviço');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este serviço?')) return;
    try {
      await firebaseUtils.deleteDocument('services', id);
      toast.success('Serviço excluído');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Button
            onClick={openAdd}
            className="bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest text-xs font-bold"
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Serviço
          </Button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-gray-500 uppercase tracking-widest text-xs animate-pulse">
          Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(svc => (
            <div
              key={svc.id}
              className="bg-white/[0.02] border border-white/10 p-6 space-y-4 group relative hover:border-amber-500/30 transition-colors"
            >
              {/* Edit/Delete actions */}
              {isAdmin && (
                <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon" variant="ghost"
                    className="h-7 w-7 text-amber-500 hover:bg-amber-500/10"
                    onClick={() => openEdit(svc)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon" variant="ghost"
                    className="h-7 w-7 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleDelete(svc.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <h3 className="font-bold uppercase tracking-widest text-sm pr-16">{svc.name}</h3>

              {svc.description && (
                <p className="text-xs text-gray-500 leading-relaxed">{svc.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center text-xs text-gray-400 uppercase tracking-widest">
                  <Clock className="h-3 w-3 mr-1.5" /> {svc.duration} min
                </div>
                <div className="text-amber-500 font-black italic text-2xl">
                  R$ {svc.price.toFixed(2)}
                </div>
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="col-span-3 p-12 text-center text-gray-500 uppercase tracking-widest text-xs">
              Nenhum serviço cadastrado.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#111] border-white/10 rounded-none text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-bold text-base">
              {editing ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Nome *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                placeholder="Ex: Corte Social"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Descrição</Label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-none p-3 text-sm text-white resize-none h-16 focus:outline-none focus:border-amber-500 placeholder:text-gray-600"
                placeholder="Descrição do serviço..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-400">Preço (R$) *</Label>
                <Input
                  type="number" min="0" step="0.01"
                  value={form.price || ''}
                  onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-400">Duração (min)</Label>
                <Input
                  type="number" min="5" step="5"
                  value={form.duration || ''}
                  onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="30"
                />
              </div>
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

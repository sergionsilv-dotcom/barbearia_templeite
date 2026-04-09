import React, { useState, useEffect } from 'react';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Client } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, User } from 'lucide-react';
import { PhoneInput } from '../ui/phone-input';


const emptyClient = (): Omit<Client, 'id'> => ({
  name: '',
  phone: '',
  email: '',
  birthDate: '',
  notes: '',
  createdAt: new Date().toISOString(),
});

export const ClientsTab: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, 'id'>>(emptyClient());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = firebaseUtils.subscribeToCollection<Client>('clients', [], (data) => {
      setClients(data.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyClient());
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      birthDate: client.birthDate || '',
      notes: client.notes || '',
      createdAt: client.createdAt,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await firebaseUtils.updateDocument<Client>('clients', editing.id, form);
        toast.success('Cliente atualizado!');
      } else {
        await firebaseUtils.addDocument('clients', { ...form, createdAt: new Date().toISOString() });
        toast.success('Cliente cadastrado!');
      }
      setModalOpen(false);
    } catch {
      toast.error('Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este cliente?')) return;
    try {
      await firebaseUtils.deleteDocument('clients', id);
      toast.success('Cliente excluído');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
          />
        </div>
        <Button
          onClick={openAdd}
          className="bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest text-xs font-bold"
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <Badge className="rounded-none text-xs uppercase tracking-widest bg-white/5 text-gray-400 border-white/10 py-1 px-3">
          {clients.length} clientes cadastrados
        </Badge>
        {search && (
          <Badge className="rounded-none text-xs uppercase tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/20 py-1 px-3">
            {filtered.length} resultado(s)
          </Badge>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 uppercase tracking-widest text-xs animate-pulse">
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <User className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 uppercase tracking-widest text-xs">
              {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Nome</th>
                <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Telefone</th>
                <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500 hidden md:table-cell">Email</th>
                <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500 hidden lg:table-cell">Aniversário</th>
                <th className="p-4 text-xs uppercase tracking-widest font-bold text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="font-bold uppercase tracking-widest text-sm">{c.name}</div>
                    {c.notes && (
                      <div className="text-xs text-gray-600 mt-1 truncate max-w-xs">{c.notes}</div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-400">{c.phone}</td>
                  <td className="p-4 text-sm text-gray-400 hidden md:table-cell">{c.email || '—'}</td>
                  <td className="p-4 text-sm text-gray-400 hidden lg:table-cell">
                    {c.birthDate
                      ? new Date(c.birthDate + 'T12:00:00').toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <Button
                        size="icon" variant="ghost"
                        className="h-8 w-8 text-amber-500 hover:bg-amber-500/10"
                        onClick={() => openEdit(c)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#111] border-white/10 rounded-none text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-bold text-base">
              {editing ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Nome *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Telefone *</Label>
              <PhoneInput
                value={form.phone}
                onChange={value => setForm(f => ({ ...f, phone: value }))}
                placeholder="(00) 00000-0000"
              />

            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Email</Label>
              <Input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                placeholder="email@exemplo.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Data de Nascimento</Label>
              <Input
                value={form.birthDate}
                onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                type="date"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Observações</Label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-none p-3 text-sm text-white resize-none h-20 focus:outline-none focus:border-amber-500 placeholder:text-gray-600"
                placeholder="Preferências, alergias, observações..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="border border-white/20 bg-transparent text-gray-300 px-4 py-2 rounded-none uppercase tracking-widest text-xs hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
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

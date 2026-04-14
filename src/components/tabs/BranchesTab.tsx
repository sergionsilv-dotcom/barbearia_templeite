import React, { useState, useEffect } from 'react';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Branch } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner';
import { Plus, MapPin, Phone, Instagram, Check, Building2, Store } from 'lucide-react';

export const BranchesTab: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Branch>>({
    name: '',
    address: '',
    phone: '',
    instagram: '',
    isMain: false,
    active: true,
  });

  useEffect(() => {
    const unsub = firebaseUtils.subscribeToCollection<Branch>('branches', [], (data) => {
      setBranches(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.address) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    try {
      const data = {
        ...form,
        createdAt: new Date().toISOString(),
      } as Branch;

      if (form.id) {
        await firebaseUtils.updateDocument('branches', form.id, data);
        toast.success('Unidade atualizada!');
      } else {
        await firebaseUtils.addDocument('branches', data);
        toast.success('Nova unidade criada!');
      }
      setModalOpen(false);
      setForm({ name: '', address: '', phone: '', instagram: '', isMain: false, active: true });
    } catch (error) {
      toast.error('Erro ao salvar unidade.');
    }
  };

  const editBranch = (b: Branch) => {
    setForm(b);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter italic">Gestão de Unidades</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gerencie sua Matriz e Filiais</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-none uppercase tracking-widest text-xs font-black"
              onClick={() => setForm({ name: '', address: '', phone: '', instagram: '', isMain: false, active: true })}
            >
              <Plus className="h-4 w-4 mr-2" /> Nova Unidade
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#111] border-white/10 rounded-none text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest font-bold text-base">
                {form.id ? 'Editar Unidade' : 'Novas Unidade'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-400">Nome da Unidade *</Label>
                <Input 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="Ex: Matriz Centro"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-400">Endereço Completo *</Label>
                <Input 
                  value={form.address} 
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="Rua, Número, Bairro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Telefone</Label>
                  <Input 
                    value={form.phone} 
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Instagram (@)</Label>
                  <Input 
                    value={form.instagram} 
                    onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-400">ID do Dispositivo Square (Opcional)</Label>
                <Input 
                  value={form.squareDeviceId || ''} 
                  onChange={e => setForm(f => ({ ...f, squareDeviceId: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="Ex: DEV-123456"
                />
                <p className="text-[9px] text-gray-600 uppercase">Usado para enviar pagamentos direto para a maquininha.</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isMain"
                  checked={form.isMain}
                  onChange={e => setForm(f => ({ ...f, isMain: e.target.checked }))}
                  className="rounded-none border-white/10"
                />
                <Label htmlFor="isMain" className="text-xs uppercase tracking-widest text-amber-500 font-bold">Definir como Matriz Principal</Label>
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-none uppercase tracking-widest text-xs font-black py-6 mt-4"
              >
                Salvar Unidade
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(b => (
          <Card key={b.id} className="bg-white/[0.02] border-white/10 rounded-none hover:bg-white/[0.04] transition-colors group cursor-pointer" onClick={() => editBranch(b)}>
            <CardHeader className="p-4 border-b border-white/5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {b.isMain ? <Building2 className="h-5 w-5 text-amber-500" /> : <Store className="h-5 w-5 text-gray-400" />}
                  <div>
                    <CardTitle className="uppercase tracking-widest text-sm font-bold">{b.name}</CardTitle>
                    {b.isMain && <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 font-black uppercase">Matriz</span>}
                  </div>
                </div>
                {b.active ? (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] uppercase font-bold rounded-none">Ativa</Badge>
                ) : (
                  <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[9px] uppercase font-bold rounded-none">Inativa</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-4 text-xs text-gray-500">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="line-clamp-2 uppercase tracking-tighter">{b.address}</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {b.phone || 'Sem fone'}
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="h-3.5 w-3.5" /> @{b.instagram || 'n/a'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {loading && (
          <div className="col-span-full py-12 text-center text-gray-600 uppercase tracking-widest text-xs animate-pulse">
            Carregando unidades...
          </div>
        )}

        {!loading && branches.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/[0.01] border border-dashed border-white/10">
            <Building2 className="h-12 w-12 text-gray-800 mx-auto mb-4" />
            <p className="text-gray-600 uppercase tracking-widest text-[10px]">Nenhuma unidade cadastrada. Crie uma para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Badge: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <span className={`px-2 py-0.5 border ${className}`}>{children}</span>
);

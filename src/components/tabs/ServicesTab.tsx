import React, { useState, useEffect } from 'react';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Service } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Clock, Store } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useLocationContext } from '../../LocationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../lib/currency';

const emptyService = (): Omit<Service, 'id'> => ({
  name: '',
  description: '',
  price: 0,
  duration: 30,
  locationId: '',
});

export const ServicesTab: React.FC<{ activeBranchId?: string | null }> = ({ activeBranchId }) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { branches, activeBranch, networkConfig } = useLocationContext();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<Omit<Service, 'id'>>(emptyService());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = firebaseUtils.subscribeToCollection<Service>('services', [], (data) => {
      const isAll = activeBranchId === 'all';
      const filtered = data.filter(s => 
        isAll || 
        !activeBranchId || 
        s.locationId === activeBranchId || 
        (!s.locationId && activeBranch?.isMain)
      );
      setServices(filtered.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });
    return () => unsub();
  }, [activeBranchId, activeBranch]);

  const isAdmin = profile?.role === 'admin';
  const currencyCode = networkConfig.currency || 'BRL';
  const locale = networkConfig.language || 'pt-BR';

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
      locationId: svc.locationId || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.price <= 0) {
      toast.error(t('services_tab.required'));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await firebaseUtils.updateDocument<Service>('services', editing.id, form);
        toast.success(t('services_tab.save_success'));
      } else {
        await firebaseUtils.addDocument('services', form);
        toast.success(t('services_tab.save_success'));
      }
      setModalOpen(false);
    } catch {
      toast.error(t('services_tab.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('services_tab.delete_confirm'))) return;
    try {
      await firebaseUtils.deleteDocument('services', id);
      toast.success(t('services_tab.delete_success'));
    } catch {
      toast.error(t('services_tab.delete_error'));
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
            <Plus className="h-4 w-4 mr-2" /> {t('services_tab.new_svc')}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-gray-500 uppercase tracking-widest text-xs animate-pulse">
            {t('common.loading')}
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
                <div className="flex flex-col gap-1">
                  <div className="flex items-center text-[10px] text-gray-400 uppercase tracking-widest">
                    <Clock className="h-3 w-3 mr-1.5" /> {svc.duration} min
                  </div>
                  {svc.locationId && (
                    <div className="flex items-center text-[9px] text-amber-500/50 uppercase tracking-tighter">
                      <Store className="h-2.5 w-2.5 mr-1" /> {branches.find(b => b.id === svc.locationId)?.name || 'Unit'}
                    </div>
                  )}
                </div>
                <div className="text-amber-500 font-black italic text-2xl">
                  {formatCurrency(svc.price, currencyCode, locale)}
                </div>
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="col-span-3 p-12 text-center text-gray-500 uppercase tracking-widest text-xs">
                {t('services_tab.no_services')}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#111] border-white/10 rounded-none text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-bold text-base">
              {editing ? t('services_tab.edit_svc') : t('services_tab.new_svc')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">{t('services_tab.svc_name')} *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                placeholder="Ex: Social Cut"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">{t('services_tab.svc_desc')}</Label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-none p-3 text-sm text-white resize-none h-16 focus:outline-none focus:border-amber-500 placeholder:text-gray-600"
                placeholder={t('services_tab.svc_desc') + "..."}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-400">{t('services_tab.svc_price')} *</Label>
                <Input
                  type="number" min="0" step="0.01"
                  value={form.price || ''}
                  onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-400">{t('services_tab.svc_duration')}</Label>
                <Input
                  type="number" min="5" step="5"
                  value={form.duration || ''}
                  onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">{t('services_tab.svc_location')}</Label>
              <Select 
                value={form.locationId || 'all'} 
                onValueChange={(val) => setForm(f => ({ ...f, locationId: val === 'all' ? '' : val }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-10 uppercase tracking-widest text-[10px]">
                  <SelectValue placeholder={t('services_tab.svc_global')} />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-white/10 text-white rounded-none">
                  <SelectItem value="all" className="uppercase tracking-widest text-[10px]">{t('services_tab.svc_global')}</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id} className="uppercase tracking-widest text-[10px]">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-gray-600 uppercase">{t('services_tab.svc_helper')}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-white/10 rounded-none uppercase tracking-widest text-xs"
            >
              {t('common.back')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest text-xs font-bold"
            >
              {saving ? t('common.processing') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

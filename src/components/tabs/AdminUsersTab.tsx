import React, { useState, useEffect } from 'react';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Barber, UserRole, UserPermission } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { Shield, ShieldCheck } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { useTranslation } from 'react-i18next';

export const AdminUsersTab: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = firebaseUtils.subscribeToCollection<Barber>('users', [], (data) => {
      setUsers(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const allPermissions: { id: UserPermission; label: string }[] = [
    { id: 'view_calendar', label: t('team.perm_view_calendar') },
    { id: 'manage_appointments', label: t('team.perm_manage_appointments') },
    { id: 'view_financials', label: t('team.perm_view_financials') },
    { id: 'manage_inventory', label: t('team.perm_manage_inventory') },
    { id: 'manage_expenses', label: t('team.perm_manage_expenses') },
    { id: 'manage_users', label: t('team.perm_manage_users') },
    { id: 'manage_services', label: t('team.perm_manage_services') },
  ];

  const updateUserRole = async (uid: string, role: UserRole) => {
    try {
      await firebaseUtils.updateDocument('users', uid, { role });
      toast.success(t('team.update_success'));
    } catch {
      toast.error(t('team.update_error'));
    }
  };

  const togglePermission = async (user: Barber, permission: UserPermission) => {
    const currentPermissions = user.permissions || [];
    const newPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter((p) => p !== permission)
      : [...currentPermissions, permission];

    try {
      await firebaseUtils.updateDocument('users', user.uid, { permissions: newPermissions });
      toast.success(t('team.perm_success'));
    } catch {
      toast.error(t('team.perm_error'));
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500 uppercase tracking-widest text-xs">{t('team.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">{t('team.title')}</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{t('team.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {users.sort((a, b) => (a.role === 'admin' ? -1 : 1)).map((user) => (
          <Card key={user.uid} className="bg-white/[0.02] border-white/10 rounded-none overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              {/* User Info & Role */}
              <div className="p-6 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.01]">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-white/10 border border-white/10">
                    <img 
                      src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                      alt={user.name} 
                    />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-widest text-sm">{user.name}</h3>
                    <div className="flex items-center mt-1">
                      {user.role === 'admin' ? (
                        <span className="text-[10px] bg-amber-500/20 text-amber-500 border border-amber-500/20 px-2 py-0.5 font-black uppercase italic">
                          {t('team.role_admin')}
                        </span>
                      ) : user.role === 'manager' ? (
                        <span className="text-[10px] bg-blue-500/20 text-blue-500 border border-blue-500/20 px-2 py-0.5 font-black uppercase italic">
                          {t('team.role_manager')}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-500/20 text-gray-400 border border-white/10 px-2 py-0.5 font-black uppercase italic">
                          {t('team.role_barber')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {user.role !== 'admin' && (
                  <div className="space-y-3">
                    <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-gray-500 block mb-2">{t('team.change_role')}</Label>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant={user.role === 'manager' ? 'default' : 'outline'}
                        className={`rounded-none text-[10px] uppercase font-bold flex-1 ${user.role === 'manager' ? 'bg-blue-600 hover:bg-blue-700' : 'border-white/10'}`}
                        onClick={() => updateUserRole(user.uid, 'manager')}
                      >
                        {t('team.role_manager')}
                      </Button>
                      <Button 
                        size="sm" 
                        variant={user.role === 'barber' ? 'default' : 'outline'}
                        className="rounded-none text-[10px] uppercase font-bold border-white/10 flex-1 data-[state=active]:bg-white/10"
                        onClick={() => updateUserRole(user.uid, 'barber')}
                      >
                        {t('team.role_barber')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Permissions */}
              <div className="p-6 md:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="h-4 w-4 text-amber-500" />
                  <h4 className="text-xs font-black uppercase italic tracking-widest">{t('team.permissions_title')}</h4>
                </div>

                {user.role === 'admin' ? (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 flex items-center space-x-3">
                    <ShieldCheck className="h-5 w-5 text-amber-500" />
                    <p className="text-xs text-amber-500/80 font-bold uppercase tracking-widest">
                      {t('team.admin_full_access')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {allPermissions.map((perm) => (
                      <div key={perm.id} className="flex items-center space-x-3 p-3 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                        <Checkbox 
                          id={`${user.uid}-${perm.id}`}
                          checked={user.permissions?.includes(perm.id)}
                          onCheckedChange={() => togglePermission(user, perm.id)}
                          className="border-white/20 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                        />
                        <label 
                          htmlFor={`${user.uid}-${perm.id}`}
                          className="text-[11px] font-medium uppercase tracking-widest text-gray-400 cursor-pointer select-none grow"
                        >
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

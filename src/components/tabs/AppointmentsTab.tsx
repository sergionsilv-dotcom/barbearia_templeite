import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../AuthContext';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { Appointment, Service, Barber, Transaction } from '../../types';
import { toast } from 'sonner';
import { AppointmentsCalendar } from '../AppointmentsCalendar';
import { useLocationContext } from '../../LocationContext';

export const AppointmentsTab: React.FC = () => {
  const { t } = useTranslation();
  const { profile, isBarber } = useAuth();
  const { activeBranchId, activeBranch } = useLocationContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const unsubApt = firebaseUtils.subscribeToCollection<Appointment>(
      'appointments', [],
      (data) => {
        const isAll = activeBranchId === 'all';
        // Filter by location
        const filteredByLocation = data.filter(a => 
          isAll || !activeBranchId || a.locationId === activeBranchId || (!a.locationId && activeBranch?.isMain)
        );
        
        const sorted = filteredByLocation.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // RBAC: Barbers only see their own appointments
        setAppointments(
          isBarber
            ? sorted.filter(a => a.barberId === profile.uid)
            : sorted
        );
        setLoading(false);
      }
    );

    const unsubSvc = firebaseUtils.subscribeToCollection<Service>('services', [], (data) => {
      const isAll = activeBranchId === 'all';
      setServices(data.filter(s => isAll || !activeBranchId || s.locationId === activeBranchId || !s.locationId));
    });
    
    const unsubBarbers = firebaseUtils.subscribeToCollection<Barber>(
      'users', [],
      (data) => {
        const roles = ['barber', 'admin', 'manager'];
        const isAll = activeBranchId === 'all';
        const filtered = data.filter(u => 
          roles.includes(u.role) && 
          (isAll || !activeBranchId || u.locationId === activeBranchId || !u.locationId)
        );
        setBarbers(filtered);
      }
    );

    return () => { unsubApt(); unsubSvc(); unsubBarbers(); };
  }, [profile, activeBranchId, activeBranch, isBarber]);

  const updateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await firebaseUtils.updateDocument('appointments', id, { status });
      toast.success(t('appointments.status_updated'));
    } catch {
      toast.error(t('appointments.error_update'));
    }
  };

  const handlePaymentRecord = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      await firebaseUtils.addDocument('sales', transaction);
      if (transaction.appointmentId) {
        await firebaseUtils.updateDocument('appointments', transaction.appointmentId, { 
          status: 'completed' 
        });
      }
      toast.success(t('financial.payment_success'));
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(t('financial.error_payment'));
      throw error;
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500 uppercase tracking-widest text-xs animate-pulse">{t('common.loading')}</div>;

  return (
    <AppointmentsCalendar
      appointments={appointments}
      services={services}
      barbers={barbers}
      onStatusUpdate={updateStatus}
      onPaymentRecord={handlePaymentRecord}
    />
  );
};

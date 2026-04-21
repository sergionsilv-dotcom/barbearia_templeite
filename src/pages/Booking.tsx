import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { firebaseUtils } from '../lib/firebaseUtils';
import { Service, Barber, Appointment, Client } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { format, startOfToday, isBefore } from 'date-fns';
import { ptBR, enUS, es, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../lib/currency';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { PhoneInput } from '../components/ui/phone-input';
import { useLocationContext } from '../LocationContext';
import { Store, Building2, MapPin as Pin } from 'lucide-react';


export const Booking: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { branches, networkConfig } = useLocationContext();

  const getDateLocale = () => {
    switch(networkConfig.language) {
      case 'en-US': return enUS;
      case 'es-ES': return es;
      case 'fr-FR': return fr;
      default: return ptBR;
    }
  };

  const currencyCode = networkConfig.currency || 'BRL';
  const locale = networkConfig.language || 'pt-BR';

  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [step, setStep] = useState(0); // Start at Step 0: Branch Selection
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'local'>('local');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedBranch && step > 0) return;
    
    const fetchData = async () => {
      const s = await firebaseUtils.getCollection<Service>('services', []);
      const b = await firebaseUtils.getCollection<Barber>('users', []);
      
      const mainBranchId = branches.find(br => br.isMain)?.id;

      // Filter by branch with backward compatibility (null or matching)
      setServices(s.filter(service => 
        !selectedBranch || 
        service.locationId === selectedBranch || 
        !service.locationId
      ));
      setBarbers(b.filter(u => 
        (u.role === 'barber' || u.role === 'admin' || u.role === 'manager') &&
        (!selectedBranch || u.locationId === selectedBranch || !u.locationId)
      ));
    };
    fetchData();
  }, [selectedBranch, branches]);

  // Handle single branch auto-select
  useEffect(() => {
    if (branches.length === 1 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
      setStep(1);
    }
  }, [branches, selectedBranch]);

  // Auto-fill client data if phone exists
  useEffect(() => {
    const lookupClient = async () => {
      if (customerPhone.length >= 10) {
        try {
          const q = query(collection(db, 'clients'), where('phone', '==', customerPhone));
          const snap = await getDocs(q);
          
          if (!snap.empty) {
            const clientData = snap.docs[0].data() as Client;
            
            if (!customerName) setCustomerName(clientData.name);
            if (!customerEmail) setCustomerEmail(clientData.email);
            
            toast.success(t('appointments.welcome_back'));
          }
        } catch (err) {
          console.error("Lookup error:", err);
        }
      }
    };

    const debounceTimer = setTimeout(lookupClient, 1000);
    return () => clearTimeout(debounceTimer);
  }, [customerPhone, customerName, customerEmail, t]);

  const timeSlots = [
    '10:00', '10:45', '11:30', '12:15', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30', '18:15'
  ];

  const autoRegisterClient = async () => {
    if (!customerPhone) return;
    try {
      const q = query(collection(db, 'clients'), where('phone', '==', customerPhone));
      const snap = await getDocs(q);
      if (snap.empty) {
        const newClient: Omit<Client, 'id'> = {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          createdAt: new Date().toISOString(),
        };
        await firebaseUtils.addDocument('clients', newClient);
      }
    } catch {
      // Non-critical
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !customerName) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const appointmentDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes));

      const newAppointment: Omit<Appointment, 'id'> = {
        barberId: selectedBarber,
        customerName,
        customerEmail,
        customerPhone,
        serviceId: selectedService,
        locationId: selectedBranch,
        date: appointmentDate.toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await firebaseUtils.addDocument('appointments', newAppointment);
      await autoRegisterClient();
      setStep(5);
      toast.success(t('appointments.success'));
    } catch (error) {
      toast.error(t('appointments.error'));
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceData = services.find(s => s.id === selectedService);
  const selectedBarberData = barbers.find(b => b.uid === selectedBarber);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold uppercase tracking-tighter italic mb-4">{t('nav.book')}</h1>
        <div className="flex justify-center items-center space-x-4 text-[10px] uppercase tracking-widest font-bold">
          <span className={step >= 0 ? 'text-amber-500' : 'text-gray-600'}>0. {t('tabs.branches')}</span>
          <span className="text-gray-800">/</span>
          <span className={step >= 1 ? 'text-amber-500' : 'text-gray-600'}>1. {t('tabs.services')}</span>
          <span className="text-gray-800">/</span>
          <span className={step >= 2 ? 'text-amber-500' : 'text-gray-600'}>2. {t('appointments.time')}</span>
          <span className="text-gray-800">/</span>
          <span className={step >= 3 ? 'text-amber-500' : 'text-gray-600'}>3. {t('appointments.data')}</span>
          <span className="text-gray-800">/</span>
          <span className={step >= 4 ? 'text-amber-500' : 'text-gray-600'}>4. {t('tabs.financial')}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  onClick={() => setSelectedBranch(branch.id)}
                  className={`p-6 border cursor-pointer transition-all flex flex-col items-center text-center space-y-4 ${
                    selectedBranch === branch.id
                      ? 'border-amber-500 bg-amber-500/5'
                      : 'border-white/10 hover:border-white/30 bg-white/[0.02]'
                  }`}
                >
                  <div className="p-4 bg-white/5 rounded-full">
                    {branch.isMain ? <Building2 className="h-8 w-8 text-amber-500" /> : <Store className="h-8 w-8 text-gray-400" />}
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-widest mb-2">{branch.name}</h3>
                    <div className="flex items-center justify-center text-[10px] text-gray-500 gap-1 uppercase tracking-tighter">
                      <Pin className="h-3 w-3" /> {branch.address}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center pt-8">
              <Button 
                disabled={!selectedBranch}
                onClick={() => setStep(1)}
                className="bg-amber-600 hover:bg-amber-700 rounded-none px-12 py-6 uppercase tracking-widest font-bold"
              >
                {t('appointments.choose_branch')}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="uppercase tracking-widest text-xs text-gray-500">{t('appointments.select_service')}</Label>
                <div className="grid gap-4">
                  {services.length === 0 ? (
                    <div className="p-12 border border-dashed border-white/10 text-center space-y-4">
                      <p className="text-gray-500 text-sm uppercase tracking-widest">{t('appointments.no_services')}.</p>
                      <Button 
                        variant="outline" 
                        onClick={() => window.open(`https://wa.me/${networkConfig.phone || ''}`, '_blank')}
                        className="rounded-none border-amber-500/50 text-amber-500 hover:bg-amber-500/10 text-[10px] uppercase tracking-widest"
                      >
                         {t('common.contact')} WhatsApp
                      </Button>
                    </div>
                  ) : (
                    services.map((service) => (
                      <div 
                        key={service.id}
                        onClick={() => setSelectedService(service.id)}
                        className={`p-6 border cursor-pointer transition-all ${
                          selectedService === service.id 
                          ? 'border-amber-500 bg-amber-500/5' 
                          : 'border-white/10 hover:border-white/30 bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold uppercase tracking-widest">{service.name}</h3>
                          <span className="text-amber-500 font-black italic">{formatCurrency(service.price, currencyCode, locale)}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {service.duration} min</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="uppercase tracking-widest text-xs text-gray-500">{t('appointments.select_barber')}</Label>
                <div className="grid gap-4">
                  {barbers.length === 0 ? (
                    <div className="p-8 bg-white/5 border border-white/10 text-center">
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest">{t('professionals.no_professionals')}</p>
                    </div>
                  ) : (
                    barbers.map((barber) => (
                      <div 
                        key={barber.uid}
                        onClick={() => setSelectedBarber(barber.uid)}
                        className={`p-6 border cursor-pointer transition-all flex items-center space-x-4 ${
                          selectedBarber === barber.uid 
                          ? 'border-amber-500 bg-amber-500/5' 
                          : 'border-white/10 hover:border-white/30 bg-white/[0.02]'
                        }`}
                      >
                        <div className="h-12 w-12 bg-white/10 rounded-full overflow-hidden">
                          <img src={barber.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${barber.name}`} alt={barber.name} />
                        </div>
                        <div>
                          <h3 className="font-bold uppercase tracking-widest">{barber.name}</h3>
                          <p className="text-xs text-gray-500 uppercase tracking-widest">{t('professionals.specialist')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)} className="uppercase tracking-widest text-xs font-bold">{t('common.back')}</Button>
              <Button 
                disabled={!selectedService || !selectedBarber}
                onClick={() => setStep(2)}
                className="bg-amber-600 hover:bg-amber-700 rounded-none px-12 py-6 uppercase tracking-widest font-bold"
              >
                {t('common.next')}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
          >
            <div className="space-y-4">
              <Label className="uppercase tracking-widest text-xs text-gray-500">{t('appointments.select_date')}</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(date, startOfToday())}
                className="bg-white/5 border border-white/10 rounded-none p-4"
                locale={getDateLocale()}
              />
            </div>
            <div className="space-y-4">
              <Label className="uppercase tracking-widest text-xs text-gray-500">{t('appointments.select_time')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-3 text-sm font-medium border transition-all rounded-none uppercase tracking-widest ${
                      selectedTime === time
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              <div className="pt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="uppercase tracking-widest text-xs">{t('common.back')}</Button>
                <Button 
                  disabled={!selectedTime || !selectedDate}
                  onClick={() => setStep(3)}
                  className="bg-amber-600 hover:bg-amber-700 rounded-none px-12 py-6 uppercase tracking-widest font-bold"
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md mx-auto space-y-8"
          >
            <div className="bg-white/5 border border-white/10 p-8 space-y-6">
              <div className="space-y-2">
                <Label className="uppercase tracking-widest text-xs text-gray-500">{t('clients.full_name')}</Label>
                <Input 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-black border-white/10 rounded-none"
                  placeholder={t('clients.full_name_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label className="uppercase tracking-widest text-xs text-gray-500">{t('clients.email')}</Label>
                <Input 
                  type="email"
                  value={customerEmail} 
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="bg-black border-white/10 rounded-none"
                  placeholder={t('clients.email_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label className="uppercase tracking-widest text-xs text-gray-500">{t('common.phone')}</Label>
                <PhoneInput 
                  value={customerPhone} 
                  onChange={(value) => setCustomerPhone(value)}
                  placeholder={t('clients.phone_placeholder')}
                />
              </div>

            </div>

            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => setStep(2)} className="uppercase tracking-widest text-xs">{t('common.back')}</Button>
              <Button 
                disabled={!customerName || !customerPhone}
                onClick={() => setStep(4)}
                className="bg-amber-600 hover:bg-amber-700 rounded-none px-12 py-6 uppercase tracking-widest font-bold"
              >
                {t('common.next')}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md mx-auto space-y-8"
          >
            <div className="space-y-4">
              <Label className="uppercase tracking-widest text-xs text-gray-500">{t('appointments.select_payment')}</Label>
              <div className="grid gap-4">
                {[
                  { id: 'local', name: t('financial.pay_local'), desc: t('financial.pay_local_desc') },
                  { id: 'interac', name: 'Interac e-Transfer', desc: 'Transferência instantânea' },
                  { id: 'card', name: t('financial.pay_online'), desc: t('financial.pay_online_desc') }
                ].map((method) => (
                  <div 
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`p-6 border cursor-pointer transition-all ${
                      paymentMethod === method.id 
                      ? 'border-amber-500 bg-amber-500/5' 
                      : 'border-white/10 hover:border-white/30 bg-white/[0.02]'
                    }`}
                  >
                    <h3 className="font-bold uppercase tracking-widest text-sm">{method.name}</h3>
                    <p className="text-xs text-gray-500">{method.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-6 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500">{t('appointments.final_summary')}</h4>
              <p className="text-sm font-bold">{selectedServiceData?.name} {t('common.with')} {selectedBarberData?.name}</p>
              <p className="text-xs text-gray-400">
                {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: getDateLocale() })} às {selectedTime}
              </p>
              <p className="text-lg font-black italic text-amber-500">
                Total: {formatCurrency((selectedServiceData?.price || 0), currencyCode, locale)}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => setStep(3)} className="uppercase tracking-widest text-xs">{t('common.back')}</Button>
              <Button 
                disabled={loading}
                onClick={handleBooking}
                className="bg-amber-600 hover:bg-amber-700 rounded-none px-12 py-6 uppercase tracking-widest font-bold"
              >
                {loading ? t('common.processing') : t('appointments.finalize')}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 space-y-6"
          >
            <div className="w-20 h-20 bg-green-500/20 border border-green-500/50 flex items-center justify-center mx-auto rounded-full">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-tighter italic">{t('appointments.confirmed_title')}</h2>
            <p className="text-gray-400 max-w-sm mx-auto">
              {t('appointments.confirmed_desc', { date: (selectedDate && format(selectedDate, "dd/MM")), time: selectedTime })}
            </p>
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="border border-white/20 bg-transparent text-white px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-white/5 transition-colors"
            >
              {t('nav.home')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

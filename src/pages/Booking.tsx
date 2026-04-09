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
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { PhoneInput } from '../components/ui/phone-input';


export const Booking: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'local'>('local');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const s = await firebaseUtils.getCollection<Service>('services');
      const b = await firebaseUtils.getCollection<Barber>('users', []);
      setServices(s);
      setBarbers(b.filter(u => u.role === 'barber' || u.role === 'admin'));
    };
    fetchData();
  }, []);

  // Auto-fill client data if phone exists
  useEffect(() => {
    const lookupClient = async () => {
      // Clean phone number often contains symbols, we check the length of the string provided by PhoneInput
      // Usually starts with '+'. We trigger lookup once we have enough digits.
      if (customerPhone.length >= 10) {
        try {
          const q = query(collection(db, 'clients'), where('phone', '==', customerPhone));
          const snap = await getDocs(q);
          
          if (!snap.empty) {
            const clientData = snap.docs[0].data() as Client;
            
            // Only fill if current fields are empty to avoid overwriting intentional changes
            if (!customerName) setCustomerName(clientData.name);
            if (!customerEmail) setCustomerEmail(clientData.email);
            
            toast.success(`Bem-vindo de volta! Seus dados foram preenchidos.`);
          }
        } catch (err) {
          console.error("Lookup error:", err);
        }
      }
    };

    const debounceTimer = setTimeout(lookupClient, 1000);
    return () => clearTimeout(debounceTimer);
  }, [customerPhone, customerName, customerEmail]);

  const timeSlots = [
    '09:00', '09:45', '10:30', '11:15', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30', '18:15'
  ];

  const autoRegisterClient = async () => {
    if (!customerPhone) return;
    try {
      // Check if client with this phone already exists
      const q = query(collection(db, 'clients'), where('phone', '==', customerPhone));
      const snap = await getDocs(q);
      if (snap.empty) {
        // Register new client
        const newClient: Omit<Client, 'id'> = {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          createdAt: new Date().toISOString(),
        };
        await firebaseUtils.addDocument('clients', newClient);
      }
    } catch {
      // Non-critical — booking already saved, just skip client registration
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
        date: appointmentDate.toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await firebaseUtils.addDocument('appointments', newAppointment);
      // Auto-register the client silently
      await autoRegisterClient();
      setStep(5);
      toast.success('Agendamento realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao realizar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceData = services.find(s => s.id === selectedService);
  const selectedBarberData = barbers.find(b => b.uid === selectedBarber);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold uppercase tracking-tighter italic mb-4">Agendamento Online</h1>
        <div className="flex justify-center items-center space-x-4 text-[10px] uppercase tracking-widest font-bold">
          <span className={step >= 1 ? 'text-amber-500' : 'text-gray-600'}>1. Serviço</span>
          <span className="text-gray-800">/</span>
          <span className={step >= 2 ? 'text-amber-500' : 'text-gray-600'}>2. Horário</span>
          <span className="text-gray-800">/</span>
          <span className={step >= 3 ? 'text-amber-500' : 'text-gray-600'}>3. Dados</span>
          <span className="text-gray-800">/</span>
          <span className={step >= 4 ? 'text-amber-500' : 'text-gray-600'}>4. Pagamento</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
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
                <Label className="uppercase tracking-widest text-xs text-gray-500">Escolha o Serviço</Label>
                <div className="grid gap-4">
                  {services.map((service) => (
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
                        <span className="text-amber-500 font-black italic">R$ {service.price}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {service.duration} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="uppercase tracking-widest text-xs text-gray-500">Escolha o Barbeiro</Label>
                <div className="grid gap-4">
                  {barbers.map((barber) => (
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
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Especialista</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                disabled={!selectedService || !selectedBarber}
                onClick={() => setStep(2)}
                className="bg-amber-600 hover:bg-amber-700 rounded-none px-12 py-6 uppercase tracking-widest font-bold"
              >
                Próximo Passo
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
              <Label className="uppercase tracking-widest text-xs text-gray-500">Selecione a Data</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(date, startOfToday())}
                className="bg-white/5 border border-white/10 rounded-none p-4"
                locale={ptBR}
              />
            </div>
            <div className="space-y-4">
              <Label className="uppercase tracking-widest text-xs text-gray-500">Horários Disponíveis</Label>
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
                <Button variant="ghost" onClick={() => setStep(1)} className="uppercase tracking-widest text-xs">Voltar</Button>
                <Button 
                  disabled={!selectedTime || !selectedDate}
                  onClick={() => setStep(3)}
                  className="bg-amber-600 hover:bg-amber-700 rounded-none px-12 py-6 uppercase tracking-widest font-bold"
                >
                  Próximo Passo
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
                <Label className="uppercase tracking-widest text-xs text-gray-500">Nome Completo</Label>
                <Input 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-black border-white/10 rounded-none"
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label className="uppercase tracking-widest text-xs text-gray-500">E-mail</Label>
                <Input 
                  type="email"
                  value={customerEmail} 
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="bg-black border-white/10 rounded-none"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="uppercase tracking-widest text-xs text-gray-500">Telefone / WhatsApp</Label>
                <PhoneInput 
                  value={customerPhone} 
                  onChange={(value) => setCustomerPhone(value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

            </div>

            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => setStep(2)} className="uppercase tracking-widest text-xs">Voltar</Button>
              <Button 
                disabled={!customerName || !customerPhone}
                onClick={() => setStep(4)}
                className="bg-amber-600 hover:bg-amber-700 rounded-none px-12 py-6 uppercase tracking-widest font-bold"
              >
                Próximo Passo
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
              <Label className="uppercase tracking-widest text-xs text-gray-500">Escolha a forma de pagamento</Label>
              <div className="grid gap-4">
                {[
                  { id: 'local', name: 'Pagar no Local', desc: 'Pague após o serviço' },
                  { id: 'pix', name: 'PIX (Desconto 5%)', desc: 'Pagamento instantâneo' },
                  { id: 'card', name: 'Cartão de Crédito', desc: 'Pague agora online' }
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
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500">Resumo Final</h4>
              <p className="text-sm font-bold">{selectedServiceData?.name} com {selectedBarberData?.name}</p>
              <p className="text-xs text-gray-400">
                {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
              </p>
              <p className="text-lg font-black italic text-amber-500">
                Total: R$ {paymentMethod === 'pix' ? (selectedServiceData?.price || 0) * 0.95 : selectedServiceData?.price}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => setStep(3)} className="uppercase tracking-widest text-xs">Voltar</Button>
              <Button 
                disabled={loading}
                onClick={handleBooking}
                className="bg-amber-600 hover:bg-amber-700 rounded-none px-12 py-6 uppercase tracking-widest font-bold"
              >
                {loading ? 'Processando...' : 'Finalizar Agendamento'}
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
            <h2 className="text-3xl font-bold uppercase tracking-tighter italic">Agendamento Confirmado!</h2>
            <p className="text-gray-400 max-w-sm mx-auto">
              Seu horário foi reservado com sucesso. Te esperamos no dia {selectedDate && format(selectedDate, "dd/MM")} às {selectedTime}!
            </p>
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="border border-white/20 bg-transparent text-white px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-white/5 transition-colors"
            >
              Voltar para o Início
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

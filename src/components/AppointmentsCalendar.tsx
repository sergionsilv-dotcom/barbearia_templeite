import React, { useState, useEffect } from 'react';
import { Appointment, Service, Barber, Product, SaleProduct, Transaction } from '../types';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { firebaseUtils } from '../lib/firebaseUtils';
import { squareService } from '../lib/squareService';
import { useLocationContext } from '../LocationContext';
import { toast } from 'sonner';

interface Props {
  appointments: Appointment[];
  services: Service[];
  barbers: Barber[];
  onStatusUpdate: (id: string, status: Appointment['status']) => void;
  onPaymentRecord: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
}

const SLOT_HEIGHT = 28;   // px per 15-min slot
const DAY_START = 10 * 60; // 10:00 in minutes (updated to match new business hours)
const DAY_END = 19 * 60;  // 19:00 in minutes (updated to match new business hours)
const SLOT_MIN = 15;

function getSlots() {
  const out: number[] = [];
  for (let m = DAY_START; m < DAY_END; m += SLOT_MIN) out.push(m);
  return out;
}

function minToTop(minutes: number) {
  return ((minutes - DAY_START) / SLOT_MIN) * SLOT_HEIGHT;
}

function apptStartMin(dateStr: string) {
  const d = parseISO(dateStr);
  return d.getHours() * 60 + d.getMinutes();
}

function fmt(minutes: number) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-500/80  border-l-4 border-amber-400',
  confirmed: 'bg-sky-500/75    border-l-4 border-sky-400',
  completed: 'bg-emerald-600/70 border-l-4 border-emerald-500',
  cancelled: 'bg-red-600/40    border-l-4 border-red-500 opacity-60',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente', confirmed: 'Confirmado',
  completed: 'Concluído', cancelled: 'Cancelado',
};

export const AppointmentsCalendar: React.FC<Props> = ({
  appointments, services, barbers, onStatusUpdate, onPaymentRecord
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [checkoutAppt, setCheckoutAppt] = useState<Appointment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentTip, setPaymentTip] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'interac' | 'local'>('local');
  const [isProcessing, setIsProcessing] = useState(false);
  const [squareStatus, setSquareStatus] = useState<string | null>(null);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const { branches, networkConfig } = useLocationContext();
  
  // Products state for checkout
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<SaleProduct[]>([]);

  useEffect(() => {
    const unsub = firebaseUtils.subscribeToCollection<Product>('products', [], setProducts);
    return unsub;
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const openCheckout = (appt: Appointment) => {
    if (appt.status === 'completed' || appt.status === 'cancelled') return;
    const svc = services.find(s => s.id === appt.serviceId);
    setCheckoutAppt(appt);
    setPaymentAmount(svc?.price?.toString() || '0');
    setPaymentTip('0');
    setPaymentMethod('local');
    setCartItems([]);
  };

  const handleCheckout = async () => {
    if (!checkoutAppt) return;
    setIsProcessing(true);
    setSquareStatus(null);

    const svc = services.find(s => s.id === checkoutAppt.serviceId);
    const barber = barbers.find(b => b.uid === checkoutAppt.barberId);
    const currentBranch = branches.find(br => br.id === checkoutAppt.locationId);
    
    let amt = parseFloat(paymentAmount) || 0;
    let tip = parseFloat(paymentTip) || 0;
    const productAmt = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const total = amt + productAmt + tip;

    try {
      // 1. Lógica para Leitor Bluetooth (Web POS API - Mobile App)
      if (paymentMethod === 'card' && isMobileMode && networkConfig.squareApplicationId) {
        // Antes de sair do site, salvamos o agendamento como 'completed' mas marcamos 
        // no log que foi via App. O ideal seria salvar um estado temporário,
        // mas para simplificar para o barbeiro, vamos disparar o checkout.
        
        squareService.startMobileCheckout({
          amount: total,
          applicationId: networkConfig.squareApplicationId,
          locationId: networkConfig.squareLocationId || '',
          note: `Venda: ${checkoutAppt.customerName} - ${svc?.name}`
        });
        
        // No mobile app-to-app, o fluxo continua ao voltar para o site.
        return; 
      }

      // 2. Lógica para Square Terminal (Fixo via Nuvem)
      if (paymentMethod === 'card' && !isMobileMode && currentBranch?.squareDeviceId) {
        setSquareStatus('INICIANDO TERMINAL...');
        
        const checkout = await squareService.createCheckout({
          amount: amt + productAmt, // A gorjeta será pedida na máquina, então enviamos apenas o subtotal
          deviceId: currentBranch.squareDeviceId,
          locationId: networkConfig.squareLocationId || 'main', // LocationId da Square (configurado no portal)
        });

        setSquareStatus('AGUARDANDO PAGAMENTO NA MÁQUINA...');
        
        const result = await squareService.waitForCompletion(checkout.id, (status) => {
          if (status === 'IN_PROGRESS') setSquareStatus('PROCESSANDO CARTÃO...');
          if (status === 'CANCEL_QUEUED') setSquareStatus('CANCELAMENTO SOLICITADO...');
        });

        if (result.status !== 'COMPLETED') {
          throw new Error('Pagamento não concluído ou cancelado na máquina.');
        }

        // Se a máquina coletou gorjeta, atualizamos o valor no registro
        if (result.tip_money) {
          tip = result.tip_money.amount / 100;
        }
      }
      
      const transaction = {
        appointmentId: checkoutAppt.id,
        customerName: checkoutAppt.customerName,
        serviceId: checkoutAppt.serviceId,
        serviceName: svc?.name || 'Serviço',
        serviceAmount: amt,
        products: cartItems,
        productAmount: productAmt,
        barberId: checkoutAppt.barberId,
        barberName: barber?.name || 'Profissional',
        amount: amt + productAmt,
        tipAmount: tip,
        totalAmount: amt + productAmt + tip,
        paymentMethod: paymentMethod,
        locationId: checkoutAppt.locationId,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await onPaymentRecord(transaction);
      setCheckoutAppt(null);
      toast.success('Venda realizada com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao processar checkout.');
    } finally {
      setIsProcessing(false);
      setSquareStatus(null);
    }
  };

  const slots = getSlots();
  const totalH = slots.length * SLOT_HEIGHT;
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayAppts = appointments.filter(a => a.date.startsWith(dateStr));

  return (
    <div className="space-y-4">
      {/* ── Navigation bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setSelectedDate(d => subDays(d, 1))}
          className="p-2 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => setSelectedDate(new Date())}
          className={`px-4 py-1.5 text-[11px] uppercase tracking-widest font-bold border transition-colors ${
            isToday(selectedDate)
              ? 'border-amber-500 text-amber-500 bg-amber-500/10'
              : 'border-white/20 text-gray-400 hover:bg-white/5'
          }`}
        >
          Hoje
        </button>

        <button
          onClick={() => setSelectedDate(d => addDays(d, 1))}
          className="p-2 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-3 hover:bg-white/5 px-2 py-1 transition-colors group">
              <h2 className="text-base font-black uppercase tracking-widest italic flex items-center gap-3">
                {format(selectedDate, "EEEE, dd 'de' MMMM yyyy", { locale: ptBR })}
                <CalendarIcon className="h-4 w-4 text-amber-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              </h2>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-fit p-0 bg-[#0a0a0a] border-white/10 shadow-2xl rounded-none" align="start">
            <div className="flex">
              <div className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  className="rounded-none bg-transparent"
                />
              </div>
              <div className="w-44 border-l border-white/10 flex flex-col p-4 gap-2 bg-white/[0.02]">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Atalhos</h3>
                {[
                  { label: 'Hoje', date: new Date(), sub: format(new Date(), "EEE, MMM d", { locale: ptBR }) },
                  { label: '+2 Semanas', date: addDays(new Date(), 14), sub: format(addDays(new Date(), 14), "EEE, MMM d", { locale: ptBR }) },
                  { label: '+3 Semanas', date: addDays(new Date(), 21), sub: format(addDays(new Date(), 21), "EEE, MMM d", { locale: ptBR }) },
                  { label: '+4 Semanas', date: addDays(new Date(), 28), sub: format(addDays(new Date(), 28), "EEE, MMM d", { locale: ptBR }) },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setSelectedDate(opt.date)}
                    className="flex flex-col items-start p-3 text-left hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all group"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-widest group-hover:text-amber-500">{opt.label}</span>
                    <span className="text-[9px] text-gray-500 lowercase">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <span className="ml-auto text-xs text-gray-400 uppercase tracking-widest bg-white/5 py-1 px-3 border border-white/10">
          {dayAppts.length} agendamento{dayAppts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Legend ── */}
      <div className="flex gap-4 text-[9px] uppercase tracking-widest border-b border-white/5 pb-4">
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-gray-400">
            <span className={`inline-block w-2 h-2 rounded-full ${STATUS_STYLE[k].split(' ')[0]}`} />
            {v}
          </span>
        ))}
      </div>

      {/* ── Main Layout ── */}
      <div className="space-y-4">
        <div className="overflow-x-auto border border-white/10 rounded-none bg-black/20">
          <div style={{ display: 'flex', minWidth: 'max-content' }}>
            {/* Time column */}
            <div style={{ width: 56, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ height: 52, borderBottom: '1px solid rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'relative', height: totalH }}>
                {slots.map((m, i) =>
                  m % 60 === 0 ? (
                    <div
                      key={m}
                      style={{ position: 'absolute', top: i * SLOT_HEIGHT, width: '100%' }}
                      className="flex items-start justify-end pr-2 pt-0.5"
                    >
                      <span className="text-[10px] text-gray-600 font-mono">{fmt(m)}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* Barber columns */}
            {barbers.map((barber, bi) => {
              const barberAppts = dayAppts.filter(a => a.barberId === barber.uid);
              const completedCount = barberAppts.filter(a => a.status === 'completed').length;

              return (
                <div
                  key={barber.uid}
                  style={{
                    width: 192,
                    flexShrink: 0,
                    borderRight: bi < barbers.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  }}
                >
                  <div
                    style={{ height: 52, borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                    className="flex flex-col justify-center px-3 bg-white/[0.02]"
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-white truncate">
                      {barber.name}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {barberAppts.length} apmt · {completedCount} concluído{completedCount !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div style={{ position: 'relative', height: totalH }}>
                    {/* Current Time Indicator Line */}
                    {isToday(selectedDate) && (() => {
                      const nowMinutes = now.getHours() * 60 + now.getMinutes();
                      if (nowMinutes < DAY_START || nowMinutes >= DAY_END) return null;
                      
                      return (
                        <div 
                          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                          style={{ 
                            top: minToTop(nowMinutes),
                            borderTop: '2px solid #ef4444',
                            boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          <div className="bg-red-500 text-[8px] text-white px-1 py-0.5 rounded-r-sm font-black uppercase tracking-tighter shadow-lg">
                            {now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}
                          </div>
                        </div>
                      );
                    })()}

                    {slots.map((m, i) => (
                      <div
                        key={m}
                        style={{
                          position: 'absolute',
                          top: i * SLOT_HEIGHT,
                          width: '100%',
                          height: SLOT_HEIGHT,
                          borderBottom: `1px solid rgba(255,255,255,${m % 60 === 0 ? '0.07' : '0.03'})`,
                        }}
                      />
                    ))}

                    {barberAppts.map(appt => {
                      const service = services.find(s => s.id === appt.serviceId);
                      const startMin = apptStartMin(appt.date);
                      const duration = service?.duration ?? 45;
                      const top = minToTop(startMin);
                      const height = Math.max((duration / SLOT_MIN) * SLOT_HEIGHT - 3, SLOT_HEIGHT * 2 - 3);

                      if (startMin < DAY_START || startMin >= DAY_END) return null;

                      return (
                        <div
                          key={appt.id}
                          style={{
                            position: 'absolute',
                            top: top + 1,
                            left: 3,
                            right: 3,
                            height,
                          }}
                          className={`rounded-sm px-2 py-1 cursor-pointer overflow-hidden transition-opacity hover:opacity-90 ${STATUS_STYLE[appt.status] ?? ''} text-white`}
                          onDoubleClick={() => openCheckout(appt)}
                          title={`${appt.customerName} · ${service?.name ?? 'Serviço'} · ${fmt(startMin)} (Duplo clique para pagar)`}
                        >
                          <div className="text-[11px] font-bold leading-tight truncate">{appt.customerName}</div>
                          {height > 36 && (
                            <div className="text-[10px] opacity-80 truncate">{service?.name}</div>
                          )}
                          {height > 52 && (
                            <div className="text-[10px] opacity-60 mt-0.5">
                              {fmt(startMin)} – {fmt(startMin + duration)}
                            </div>
                          )}
                          {height > 68 && appt.status !== 'cancelled' && appt.status !== 'completed' && (
                            <div className="flex gap-1 mt-1">
                              {appt.status === 'pending' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onStatusUpdate(appt.id, 'confirmed'); }}
                                  className="bg-white/20 hover:bg-white/30 rounded-sm p-0.5 transition-colors"
                                  title="Confirmar"
                                >
                                  <Check className="h-2.5 w-2.5" />
                                </button>
                              )}
                              {appt.status === 'confirmed' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onStatusUpdate(appt.id, 'completed'); }}
                                  className="bg-white/20 hover:bg-white/30 rounded-sm p-0.5 transition-colors"
                                  title="Concluir"
                                >
                                  <Check className="h-2.5 w-2.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); onStatusUpdate(appt.id, 'cancelled'); }}
                                className="bg-white/20 hover:bg-white/30 rounded-sm p-0.5 transition-colors"
                                title="Cancelar"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CheckoutDialog 
        appointment={checkoutAppt}
        amount={paymentAmount}
        setAmount={setPaymentAmount}
        tip={paymentTip}
        setTip={setPaymentTip}
        method={paymentMethod}
        setMethod={setPaymentMethod}
        onConfirm={handleCheckout}
        onClose={() => setCheckoutAppt(null)}
        loading={isProcessing}
        serviceName={services.find(s => s.id === checkoutAppt?.serviceId)?.name}
        products={products}
        cartItems={cartItems}
        setCartItems={setCartItems}
        isMobileMode={isMobileMode}
        setIsMobileMode={setIsMobileMode}
      />
    </div>
  );
};

const CheckoutDialog: React.FC<{
  appointment: Appointment | null;
  amount: string;
  setAmount: (v: string) => void;
  tip: string;
  setTip: (v: string) => void;
  method: string;
  setMethod: (v: any) => void;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
  squareStatus?: string | null;
  isMobileMode: boolean;
  setIsMobileMode: (v: boolean) => void;
  serviceName?: string;
  products: Product[];
  cartItems: SaleProduct[];
  setCartItems: React.Dispatch<React.SetStateAction<SaleProduct[]>>;
}> = ({ 
  appointment, amount, setAmount, tip, setTip, method, setMethod, 
  onConfirm, onClose, loading, squareStatus, isMobileMode, setIsMobileMode, 
  serviceName, products, cartItems, setCartItems 
}) => {
  if (!appointment) return null;

  const productAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = (parseFloat(amount) || 0) + productAmount + (parseFloat(tip) || 0);

  const addProductToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(p => p.productId === product.id);
      if (existing) {
        return prev.map(p => p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { productId: product.id, name: product.name, quantity: 1, price: product.salePrice }];
    });
  };

  const removeProductFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(p => p.productId !== productId));
  };

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-none max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest italic font-black text-amber-500">Checkout Plus</DialogTitle>
          <DialogDescription className="text-gray-500 text-xs text-left">
            Pagamento de <strong>{appointment.customerName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4 custom-scrollbar">
          {/* Service Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-gray-400">Serviço Realizado</Label>
                <div className="text-sm font-bold uppercase">{serviceName}</div>
              </div>
              <div className="w-32">
                <Input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-none h-8 text-right font-bold text-amber-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Products Section */}
          <div className="space-y-4">
            <Label className="text-[10px] uppercase tracking-widest text-gray-400">Adicionar Produtos (Venda)</Label>
            
            {/* Products Selector */}
            <div className="grid grid-cols-2 gap-2">
              <Select onValueChange={(val) => {
                const p = products.find(p => p.id === val);
                if (p) addProductToCart(p);
              }}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-9 text-[10px] uppercase tracking-widest">
                  <SelectValue placeholder="Escolha um produto" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-none">
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-[10px] uppercase tracking-widest">
                      {p.name} (R$ {p.salePrice})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cart Items */}
            {cartItems.length > 0 && (
              <div className="space-y-2 bg-white/[0.02] border border-white/5 p-3">
                {cartItems.map(item => (
                  <div key={item.productId} className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
                      <span className="text-[9px] text-gray-500">
                        {item.quantity}x R$ {item.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black italic">R$ {(item.quantity * item.price).toFixed(2)}</span>
                      <button 
                        onClick={() => removeProductFromCart(item.productId)}
                        className="text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-white/5 pt-2 mt-2 flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Total Produtos</span>
                  <span className="text-xs font-black italic text-green-500">R$ {productAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <hr className="border-white/5" />

          {/* Tip Section */}
          <div className="space-y-4">
            <Label className="text-[10px] uppercase tracking-widest text-gray-400">Gorjeta (Opcional)</Label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 0.1, 0.15, 0.2].map((val) => {
                const baseAmt = parseFloat(amount) || 0;
                const tipVal = (baseAmt * val).toFixed(2);
                const isSelected = (val === 0 && parseFloat(tip) === 0) || (val > 0 && parseFloat(tip) === parseFloat(tipVal));
                
                return (
                  <button
                    key={val}
                    onClick={() => setTip(tipVal)}
                    className={`py-1.5 text-[9px] font-bold border transition-all ${
                      isSelected
                        ? 'bg-amber-600 border-amber-600 text-white' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {val * 100}%
                  </button>
                );
              })}
            </div>
            <Input 
              type="number"
              placeholder="Outro valor..."
              value={tip === '0' ? '' : tip}
              onChange={(e) => setTip(e.target.value)}
              className="bg-white/5 border-white/10 rounded-none h-8 text-[10px]"
            />
          </div>

          <hr className="border-white/5" />

          {/* Payment Method Section */}
          <div className="space-y-4">
            <Label className="text-[10px] uppercase tracking-widest text-gray-400">Forma de Pagamento</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'cash', label: 'Dinheiro' },
                { id: 'card', label: 'Cartão (Terminal)' },
                { id: 'interac', label: 'Interac' },
                { id: 'local', label: 'Faturar Depois (Local)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setMethod(opt.id as any)}
                  className={`py-2 text-[10px] uppercase tracking-widest font-bold border transition-all ${
                    method === opt.id 
                      ? 'bg-amber-600 border-amber-600' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {method === 'card' && (
              <div className="flex gap-2 bg-white/5 p-1 border border-white/5">
                <button
                  onClick={() => setIsMobileMode(false)}
                  className={`flex-1 py-1.5 text-[9px] uppercase font-bold tracking-tighter ${!isMobileMode ? 'bg-amber-600 text-white' : 'text-gray-500'}`}
                >
                  Maquininha Fixa (Nuvem)
                </button>
                <button
                  onClick={() => setIsMobileMode(true)}
                  className={`flex-1 py-1.5 text-[9px] uppercase font-bold tracking-tighter ${isMobileMode ? 'bg-amber-600 text-white' : 'text-gray-500'}`}
                >
                  App Square (Reader BT)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Summary */}
        <div className="border-t border-white/10 pt-4 mt-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <div>
              <div className="text-[9px] uppercase tracking-widest text-gray-500">Valor Total</div>
              <div className="text-2xl font-black italic text-amber-500">R$ {total.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-widest text-gray-500">Subtotal</div>
              <div className="text-xs font-bold text-gray-400">serv: {amount} | prod: {productAmount.toFixed(0)} | gorj: {tip}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="flex-1 rounded-none uppercase tracking-widest text-[10px] h-12"
            >
              Voltar
            </Button>
            <Button 
              onClick={onConfirm}
              disabled={loading || !amount}
              className="flex-1 bg-amber-600 hover:bg-amber-700 rounded-none uppercase tracking-widest text-[10px] font-bold h-12 relative overflow-hidden"
            >
              <span className={squareStatus ? 'opacity-20' : ''}>{loading ? 'Processando...' : 'Finalizar'}</span>
              {squareStatus && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-600">
                  <span className="animate-pulse">{squareStatus}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from 'react';
import { useLocationContext } from '../LocationContext';
import { useAuth } from '../AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Scissors, ChevronRight, ChevronLeft, CheckCircle2, Store, Phone, Instagram, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Bem-vindo', desc: 'Vamos configurar seu sistema' },
  { id: 2, title: 'Identidade', desc: 'Nome e dados da barbearia' },
  { id: 3, title: 'Contato', desc: 'Como os clientes te encontram' },
  { id: 4, title: 'Pronto!', desc: 'Tudo configurado' },
];

export const Setup: React.FC = () => {
  const { updateNetworkConfig } = useLocationContext();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slogan: '',
    instagram: '',
    phone: '',
  });

  const update = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const canProceed = () => {
    if (step === 2) return form.name.trim().length >= 2;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateNetworkConfig({
        name: form.name || 'Minha Barbearia',
        slogan: form.slogan || 'Qualidade & Estilo Moderno',
        instagram: form.instagram,
        phone: form.phone,
      });
      toast.success('Sistema configurado com sucesso!');
      setStep(4);
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,0.06),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`flex-1 h-0.5 transition-all duration-500 ${step > s.id ? 'bg-amber-500' : step === s.id ? 'bg-amber-500/50' : 'bg-white/10'}`} />
              {i < STEPS.length - 1 && (
                <div className={`w-2 h-2 rounded-full transition-all ${step > s.id ? 'bg-amber-500' : step === s.id ? 'bg-amber-400 animate-pulse' : 'bg-white/20'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Passo 1: Boas-vindas ── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <Scissors className="h-10 w-10 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white">Bem-vindo ao<br /><span className="text-amber-500">BarberPro</span></h1>
                  <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                    Sistema completo de gestão para a sua barbearia.<br />
                    Vamos configurar tudo em menos de 2 minutos.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {['Agendamentos online', 'Controle financeiro', 'Gestão de clientes', 'Pagamentos integrados'].map(item => (
                  <div key={item} className="flex items-center gap-3 text-gray-400 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <Button onClick={() => setStep(2)} className="w-full bg-amber-600 hover:bg-amber-700 rounded-none uppercase font-black italic tracking-widest h-12">
                Começar Configuração <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* ── Passo 2: Identidade ── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Store className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-black uppercase tracking-tighter italic">Identidade da Barbearia</h2>
                </div>
                <p className="text-gray-500 text-xs uppercase tracking-widest">Essas informações aparecem em todo o sistema</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Nome da Barbearia *</Label>
                  <Input
                    autoFocus
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500 font-bold text-lg h-12"
                    placeholder="Ex: Barbearia do João"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Slogan <span className="text-gray-600">(opcional)</span></Label>
                  <Input
                    value={form.slogan}
                    onChange={e => update('slogan', e.target.value)}
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500 italic"
                    placeholder="Ex: Tradição & Estilo Moderno"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="border-white/10 rounded-none uppercase font-black text-xs text-gray-500">
                  <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={() => setStep(3)} disabled={!canProceed()} className="flex-1 bg-amber-600 hover:bg-amber-700 rounded-none uppercase font-black italic tracking-widest h-11">
                  Próximo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Passo 3: Contato ── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Phone className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-black uppercase tracking-tighter italic">Contato & Redes Sociais</h2>
                </div>
                <p className="text-gray-500 text-xs uppercase tracking-widest">Esses dados ficam visíveis para seus clientes</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Phone className="h-3 w-3" /> WhatsApp <span className="text-gray-600">(formato internacional)</span>
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                    placeholder="Ex: 5511999999999"
                  />
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider">55 (Brasil) + DDD + número — sem espaços ou traços</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Instagram className="h-3 w-3" /> Instagram <span className="text-gray-600">(sem @)</span>
                  </Label>
                  <Input
                    value={form.instagram}
                    onChange={e => update('instagram', e.target.value)}
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                    placeholder="Ex: minhabarbearia"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="border-white/10 rounded-none uppercase font-black text-xs text-gray-500">
                  <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handleFinish} disabled={saving} className="flex-1 bg-amber-600 hover:bg-amber-700 rounded-none uppercase font-black italic tracking-widest h-11">
                  {saving ? 'Salvando...' : 'Finalizar Configuração'} <Zap className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Passo 4: Concluído ── */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center">
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white">
                    <span className="text-amber-500">{form.name}</span><br />está pronta!
                  </h2>
                  <p className="text-gray-500 text-sm mt-3">
                    Seu sistema foi configurado. Você pode editar qualquer informação depois em <strong className="text-gray-400">Painel → Rede / Marca</strong>.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Button onClick={() => navigate('/painel')} className="w-full bg-amber-600 hover:bg-amber-700 rounded-none uppercase font-black italic tracking-widest h-12">
                  Ir para o Painel <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full border-white/10 rounded-none uppercase font-black text-xs text-gray-500">
                  Ver Site Público
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

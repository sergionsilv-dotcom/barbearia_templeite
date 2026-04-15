import React, { useState, useEffect } from 'react';
import { useLocationContext } from '../../LocationContext';
import { useAuth } from '../../AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from 'sonner';
import { Save, Globe, Instagram, Phone, MessageSquare, ShieldCheck, ShieldAlert, Clock, Zap } from 'lucide-react';

const DEV_WHATSAPP = import.meta.env.VITE_DEVELOPER_WHATSAPP || '5511999999999';

export const SettingsTab: React.FC = () => {
  const { networkConfig, updateNetworkConfig } = useLocationContext();
  const { isPro, trialDaysRemaining } = useAuth();
  const [form, setForm] = useState(networkConfig);
  const [loading, setLoading] = useState(false);

  // Sync form when Firebase data loads (networkConfig arrives asynchronously)
  useEffect(() => {
    setForm(networkConfig);
  }, [networkConfig]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateNetworkConfig(form);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const licenseStatus = isPro
    ? { label: 'PRO ATIVO', color: 'green', icon: ShieldCheck, desc: 'Licença permanente ativa. Acesso total ao sistema.' }
    : trialDaysRemaining !== null && trialDaysRemaining > 0
      ? { label: `TESTE — ${trialDaysRemaining} dia${trialDaysRemaining === 1 ? '' : 's'}`, color: 'amber', icon: Clock, desc: `Período de avaliação gratuita. Expira em ${trialDaysRemaining} dia${trialDaysRemaining === 1 ? '' : 's'}.` }
      : { label: 'EXPIRADO', color: 'red', icon: ShieldAlert, desc: 'Período de teste encerrado. Ative sua licença para continuar.' };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Licença ── */}
      <Card className="bg-white/[0.02] border-white/10 rounded-none overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <licenseStatus.icon className={`h-5 w-5 text-${licenseStatus.color}-500`} />
            <div>
              <CardTitle className="uppercase tracking-widest text-sm font-bold">Status da Licença</CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-tighter text-gray-500">Situação da sua assinatura BarberPro</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className={`flex items-center justify-between p-4 border border-${licenseStatus.color}-500/20 bg-${licenseStatus.color}-500/5 mb-4`}>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest text-${licenseStatus.color}-400`}>{licenseStatus.label}</p>
              <p className="text-[10px] text-gray-500 mt-1">{licenseStatus.desc}</p>
            </div>
            <div className={`w-3 h-3 rounded-full bg-${licenseStatus.color}-500 ${!isPro ? 'animate-pulse' : ''}`} />
          </div>
          {!isPro && (
            <Button
              onClick={() => window.open(`https://wa.me/${DEV_WHATSAPP}?text=Olá! Gostaria de ativar a licença BarberPro para ${form.name}.`, '_blank')}
              className="w-full bg-amber-600 hover:bg-amber-700 rounded-none uppercase font-black italic tracking-widest text-xs h-11"
            >
              <Zap className="h-4 w-4 mr-2" />
              {trialDaysRemaining === 0 ? 'Ativar Licença Agora' : 'Upgrade para PRO'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Identidade Visual ── */}
      <Card className="bg-white/[0.02] border-white/10 rounded-none overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle className="uppercase tracking-widest text-sm font-bold">Configurações Rede / White Label</CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-tighter text-gray-500">Customize a identidade visual e dados globais da sua rede</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Nome da Rede / Loja</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500 font-bold"
                placeholder="Ex: Barbearia do João"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Slogan / Frase de Efeito</Label>
              <Input
                value={form.slogan}
                onChange={e => setForm(f => ({ ...f, slogan: e.target.value }))}
                className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500 italic"
                placeholder="Ex: Qualidade & Estilo Moderno"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Instagram className="h-3 w-3" /> Instagram (sem @)
                </Label>
                <Input
                  value={form.instagram}
                  onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="Ex: minhabarbearia"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Phone className="h-3 w-3" /> WhatsApp de Contato
                </Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="Ex: 5511999999999"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-400">Square Location ID</Label>
                <Input
                  value={form.squareLocationId || ''}
                  onChange={e => setForm(f => ({ ...f, squareLocationId: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="Ex: L8YXXXXXX..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-400">Square Application ID</Label>
                <Input
                  value={form.squareApplicationId || ''}
                  onChange={e => setForm(f => ({ ...f, squareApplicationId: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500"
                  placeholder="Ex: sq0idp-XXXX..."
                />
              </div>
            </div>
            <p className="text-[9px] text-gray-600 uppercase">Encontrados no Square Developer Portal &gt; Seu App. O App ID é necessário para pagamentos via iPad/Celular.</p>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-none uppercase tracking-widest text-xs font-black px-8 py-6"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
        <MessageSquare className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Dica de Gestão</p>
          <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-tight">
            As alterações feitas aqui refletem instantaneamente em todas as páginas públicas (Início, Agendar e Galeria) para todas as suas filiais. Use frases curtas e impactantes para o slogan.
          </p>
        </div>
      </div>
    </div>
  );
};

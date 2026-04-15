import React, { useState, useEffect } from 'react';
import { useLocationContext } from '../../LocationContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from 'sonner';
import { Save, Globe, Instagram, Phone, MessageSquare } from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { networkConfig, updateNetworkConfig } = useLocationContext();
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                placeholder="Ex: O Barbeiro Sergio"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Slogan / Frase de Efeito</Label>
              <Input 
                value={form.slogan} 
                onChange={e => setForm(f => ({ ...f, slogan: e.target.value }))}
                className="bg-white/5 border-white/10 rounded-none focus-visible:ring-amber-500 italic"
                placeholder="Ex: Tradição & Estilo Moderno"
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
                  placeholder="Ex: obarbeirosergio"
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

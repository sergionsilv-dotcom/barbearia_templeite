import React, { useState } from 'react';
import { useLocationContext } from '../../LocationContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Globe, DollarSign, Palette, Save, Share2, Instagram, Phone, Info } from 'lucide-react';
import { firebaseUtils } from '../../lib/firebaseUtils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../i18n';

export const SettingsTab: React.FC = () => {
  const { networkConfig } = useLocationContext();
  const { t } = useTranslation();
  const [formData, setFormData] = useState(networkConfig);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await firebaseUtils.updateDocument('config', 'network', formData);
      toast.success(t('common.save'));
    } catch (error) {
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter italic">{t('tabs.brand')}</h2>
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] mt-1">{t('settings.brand_desc')}</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-700 rounded-none px-8 py-6 uppercase tracking-widest font-bold"
        >
          {loading ? t('common.processing') : <><Save className="h-4 w-4 mr-2" /> {t('common.save')}</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Localization & Language */}
        <Card className="bg-white/[0.02] border-white/10 rounded-none">
          <CardHeader className="border-b border-white/5 bg-white/[0.01]">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center">
              <Globe className="h-4 w-4 mr-2 text-amber-500" /> Internacionalização
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-[10px] text-gray-500">{t('settings.language')}</Label>
              <select 
                value={formData.language}
                onChange={e => setFormData({...formData, language: e.target.value})}
                className="w-full bg-black border border-white/10 p-3 rounded-none text-xs uppercase tracking-widest outline-none focus:border-amber-500 transition-colors"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.label}</option>
                ))}
              </select>
              <p className="text-[9px] text-gray-600 italic">{t('settings.language_note')}</p>
            </div>

            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-[10px] text-gray-500">{t('settings.currency')}</Label>
              <select 
                value={formData.currency}
                onChange={e => setFormData({...formData, currency: e.target.value})}
                className="w-full bg-black border border-white/10 p-3 rounded-none text-xs uppercase tracking-widest outline-none focus:border-amber-500 transition-colors"
              >
                <option value="BRL">Real (R$)</option>
                <option value="USD">Dólar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">Libra (£)</option>
                <option value="CAD">Dólar Canadense (C$)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Brand Content */}
        <Card className="bg-white/[0.02] border-white/10 rounded-none">
          <CardHeader className="border-b border-white/5 bg-white/[0.01]">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center">
              <Info className="h-4 w-4 mr-2 text-amber-500" /> Identidade
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-[10px] text-gray-500">Nome da Rede/Barbearia</Label>
              <Input 
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="bg-black border-white/10 rounded-none h-12 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-[10px] text-gray-500">Slogan</Label>
              <Input 
                value={formData.slogan || ''} 
                onChange={e => setFormData({...formData, slogan: e.target.value})}
                className="bg-black border-white/10 rounded-none h-12 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact info */}
        <Card className="bg-white/[0.02] border-white/10 rounded-none md:col-span-2">
          <CardHeader className="border-b border-white/5 bg-white/[0.01]">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center">
              <Share2 className="h-4 w-4 mr-2 text-amber-500" /> Canais de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-[10px] text-gray-500 flex items-center"><Instagram className="h-3 w-3 mr-2 text-pink-500/50" /> Instagram User</Label>
              <Input 
                value={formData.instagram || ''} 
                onChange={e => setFormData({...formData, instagram: e.target.value})}
                placeholder="@username"
                className="bg-black border-white/10 rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-[10px] text-gray-500 flex items-center"><Phone className="h-3 w-3 mr-2 text-green-500/50" /> WhatsApp (Link)</Label>
              <Input 
                value={formData.whatsapp || ''} 
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                placeholder="Ex: 5511999999999"
                className="bg-black border-white/10 rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-[10px] text-gray-500">Telefone Exibição</Label>
              <Input 
                value={formData.phone || ''} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="bg-black border-white/10 rounded-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

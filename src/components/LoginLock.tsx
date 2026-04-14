import React from 'react';
import { useAuth } from '../AuthContext';
import { ShieldAlert, MessageSquare, LogOut, Code } from 'lucide-react';
import { Button } from './ui/button';
import { useLocationContext } from '../LocationContext';

export const LoginLock: React.FC = () => {
  const { logout, isDeveloper, trialDaysRemaining, isPro } = useAuth();
  const { networkSettings } = useLocationContext();

  const isTrialExpired = !isPro && trialDaysRemaining === 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.05),transparent)] pointer-events-none" />
      
      <div className="max-w-md w-full bg-zinc-950 border border-white/10 p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
            <ShieldAlert className="h-10 w-10 text-amber-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
            {isTrialExpired ? 'Teste Expirado' : 'Sistema Suspenso'}
          </h1>
          <p className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">
            {isTrialExpired ? 'Período de 30 dias concluído' : 'Licença de Uso: Pendente ou Expirada'}
          </p>
        </div>

        <div className="bg-white/5 p-4 border-l-2 border-amber-500 text-left">
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            {isTrialExpired ? (
              <>
                Olá, <strong>{networkSettings.name}</strong>. O seu período de teste de 30 dias chegou ao fim. 
                Esperamos que tenha tido uma ótima experiência! Para continuar utilizando todas as funcionalidades, 
                entre em contato agora para ativar sua licença definitiva.
              </>
            ) : (
              <>
                Olá, <strong>{networkSettings.name}</strong>. Constatamos uma pendência na ativação da sua licença. 
                Para restabelecer o acesso total ao painel e agendamentos, entre em contato com o suporte técnico.
              </>
            )}
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Button 
            onClick={() => window.open(`https://wa.me/5511999999999`, '_blank')}
            className="w-full bg-amber-600 hover:bg-amber-700 rounded-none uppercase font-black italic h-12"
          >
            <MessageSquare className="h-4 w-4 mr-2" /> Falar com o Desenvolvedor
          </Button>
          
          <Button 
            variant="outline" 
            onClick={logout}
            className="w-full border-white/10 rounded-none uppercase font-black italic text-gray-500 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sair do Sistema
          </Button>
        </div>

        {isDeveloper && (
          <div className="pt-8 border-t border-white/5">
            <p className="text-[8px] uppercase tracking-[0.3em] text-amber-500/50 font-black mb-4">
              Acesso de Mestre Detectado
            </p>
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/painel'}
              className="text-[10px] uppercase font-black tracking-widest text-amber-500 hover:bg-amber-500/10"
            >
              <Code className="h-4 w-4 mr-2" /> Ignorar Bloqueio (Modo Dev)
            </Button>
          </div>
        )}

        <div className="text-[9px] text-gray-700 uppercase tracking-widest font-bold">
          © {new Date().getFullYear()} {networkSettings.name} · Desenvolvido por Sergio Nunes
        </div>
      </div>
    </div>
  );
};

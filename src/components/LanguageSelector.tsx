import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-gray-400 hover:text-white uppercase tracking-widest text-[10px] font-bold px-2 py-1 transition-colors"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{currentLang.flag} {currentLang.label}</span>
        <span className="sm:hidden">{currentLang.flag}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[#111] border border-white/10 min-w-[160px] z-50 shadow-xl">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 uppercase tracking-widest text-[10px] font-bold hover:bg-amber-600 transition-colors ${
                i18n.language === lang.code ? 'text-amber-500' : 'text-white'
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

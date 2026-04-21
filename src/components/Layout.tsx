import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scissors, Instagram, Facebook, Phone, Menu, X, User } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../AuthContext';
import { useLocationContext } from '../LocationContext';
import { useTranslation } from 'react-i18next';

import { LanguageSelector } from './LanguageSelector';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { networkConfig } = useLocationContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.book'), path: '/agendar' },
    { name: t('nav.gallery'), path: '/galeria' },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-amber-500 selection:text-black">
      <nav className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-amber-500 p-2 transform group-hover:rotate-12 transition-transform duration-300">
                <Scissors className="h-6 w-6 text-black" />
              </div>
              <span className="text-2xl font-black uppercase tracking-tighter italic">
                {networkConfig.name.split(' ')[0]}
                <span className="text-amber-500">.</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-xs font-bold uppercase tracking-widest transition-all hover:text-amber-500 ${
                    location.pathname === item.path ? 'text-amber-500' : 'text-gray-400'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="h-4 w-[1px] bg-white/10 mx-2" />
              <LanguageSelector />
              {user ? (
                <Link to="/painel">
                  <Button className="bg-white text-black hover:bg-amber-500 hover:text-white rounded-none px-6 py-2 uppercase tracking-widest text-[10px] font-black transition-all">
                    {t('nav.panel')}
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 rounded-none px-6 py-2 uppercase tracking-widest text-[10px] font-black">
                    <User className="h-4 w-4 mr-2" />
                    {t('nav.enter')}
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-400 hover:text-white"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-black border-b border-white/10 py-6 px-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className="block text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-amber-500"
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <LanguageSelector />
              {user ? (
                <Link to="/painel" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-white text-black hover:bg-amber-500 hover:text-white rounded-none uppercase tracking-widest text-xs font-black">
                    {t('nav.panel')}
                  </Button>
                </Link>
              ) : (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-white text-black hover:bg-amber-500 hover:text-white rounded-none uppercase tracking-widest text-xs font-black">
                    {t('nav.enter')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main>{children}</main>

      <footer className="bg-black border-t border-white/10 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center space-x-3 mb-12">
            <div className="bg-white/5 p-3">
              <Scissors className="h-8 w-8 text-amber-500" />
            </div>
            <span className="text-3xl font-black uppercase tracking-tighter italic">
              {networkConfig.name}
            </span>
          </div>
          <div className="flex justify-center space-x-10 mb-12">
            {networkConfig.instagram && (
              <a href={`https://instagram.com/${networkConfig.instagram}`} className="text-gray-500 hover:text-amber-500 transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
            )}
            {networkConfig.facebook && (
              <a href={`https://facebook.com/${networkConfig.facebook}`} className="text-gray-500 hover:text-amber-500 transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
            )}
            {networkConfig.whatsapp && (
              <a href={`https://wa.me/${networkConfig.whatsapp}`} className="text-gray-500 hover:text-amber-500 transition-colors">
                <Phone className="h-6 w-6" />
              </a>
            )}
          </div>
          <p className="text-gray-600 text-[10px] uppercase tracking-[0.4em] font-bold">
            © {new Date().getFullYear()} {networkConfig.name} — ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>
    </div>
  );
};

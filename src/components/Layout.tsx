import React from 'react';
import { useAuth } from '../AuthContext';
import { useLocationContext } from '../LocationContext';
import { Button } from './ui/button';
import { Scissors, Calendar, Image as ImageIcon, User, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { user, profile, signIn, logout } = useAuth();
  const { networkConfig } = useLocationContext();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: t('nav.home'), path: '/', icon: Scissors },
    { name: t('nav.book'), path: '/agendar', icon: Calendar },
    { name: t('nav.gallery'), path: '/galeria', icon: ImageIcon },
  ];

  if (profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'barber') {
    navItems.push({ name: t('nav.panel'), path: '/painel', icon: User });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <Scissors className="h-8 w-8 text-amber-500 group-hover:rotate-12 transition-transform" />
              <span className="text-2xl font-bold tracking-tighter uppercase italic">{networkConfig.name || 'BarberPro'}</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium tracking-widest uppercase transition-colors hover:text-amber-500 ${
                    location.pathname === item.path ? 'text-amber-500' : 'text-gray-400'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="h-4 w-[1px] bg-white/10 mx-2" />
              <LanguageSelector />
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-500">{user.displayName}</span>
                  <Button variant="ghost" size="icon" onClick={logout} className="text-gray-400 hover:text-white">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Button onClick={signIn} className="bg-amber-600 hover:bg-amber-700 text-white px-6 rounded-none uppercase tracking-widest text-xs font-bold">
                  {t('nav.enter')}
                </Button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden bg-black border-b border-white/10"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-4 text-base font-medium text-gray-400 hover:text-amber-500 border-b border-white/5"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-white/5 pb-4 px-3">
                  <LanguageSelector />
                </div>
                {!user && (
                  <Button onClick={signIn} className="w-full mt-4 bg-amber-600 rounded-none uppercase tracking-widest font-bold">
                    {t('nav.enter')}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="space-y-4">
              <h3 className="text-xl font-bold uppercase tracking-widest mb-4">{networkConfig.name || 'BarberPro'}</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto lowercase italic">
                {networkConfig.slogan}
              </p>
            </div>
          </div>
          <Scissors className="h-10 w-10 text-amber-500 mx-auto mb-6" />
          <div className="flex justify-center space-x-6 mb-8">
            <a href={`https://instagram.com/${networkConfig.instagram}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-500 transition-colors uppercase tracking-widest text-[10px] font-bold">
              Instagram
            </a>
            <a href={`https://wa.me/${networkConfig.phone}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-500 transition-colors uppercase tracking-widest text-[10px] font-bold">
              WhatsApp
            </a>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-widest">
            © 2026 {networkConfig.name || 'BarberPro'}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

import React from 'react';
import { useAuth } from '../AuthContext';
import { Button } from './ui/button';
import { Scissors, Calendar, Image as ImageIcon, User, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, signIn, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Início', path: '/', icon: Scissors },
    { name: 'Agendar', path: '/agendar', icon: Calendar },
    { name: 'Galeria', path: '/galeria', icon: ImageIcon },
  ];

  if (profile?.role === 'admin' || profile?.role === 'barber') {
    navItems.push({ name: 'Painel', path: '/painel', icon: User });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Scissors className="h-8 w-8 text-amber-500" />
              <span className="text-2xl font-bold tracking-tighter uppercase italic">O Barbeiro Sergio</span>
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
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-500">{user.displayName}</span>
                  <Button variant="ghost" size="icon" onClick={logout} className="text-gray-400 hover:text-white">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Button onClick={signIn} className="bg-amber-600 hover:bg-amber-700 text-white px-6 rounded-none uppercase tracking-widest text-xs font-bold">
                  Entrar
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
                {!user && (
                  <Button onClick={signIn} className="w-full mt-4 bg-amber-600 rounded-none uppercase tracking-widest">
                    Entrar
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
          <Scissors className="h-10 w-10 text-amber-500 mx-auto mb-6" />
          <h3 className="text-xl font-bold uppercase tracking-widest mb-4">O Barbeiro Sergio</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
            Elevando o conceito de barbearia com precisão, estilo e tradição.
          </p>
          <div className="flex justify-center space-x-6 mb-8">
            <a href="https://instagram.com/obarbeirosergio" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-500 transition-colors">
              Instagram
            </a>
            <a href="#" className="text-gray-400 hover:text-amber-500 transition-colors">
              Facebook
            </a>
            <a href="#" className="text-gray-400 hover:text-amber-500 transition-colors">
              WhatsApp
            </a>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-widest">
            © 2026 O Barbeiro Sergio. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

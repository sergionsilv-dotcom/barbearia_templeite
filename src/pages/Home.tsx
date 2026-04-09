import React from 'react';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { Scissors, Star, Clock, ShieldCheck, Instagram, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2070" 
            alt="Barbershop" 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-[#0a0a0a]" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-amber-500 uppercase tracking-[0.3em] text-sm font-bold mb-4 block">
              Tradição & Estilo Moderno
            </span>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8 italic">
              O Barbeiro <br />
              <span className="text-amber-500">Sergio</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
              Mais do que um corte, uma experiência de cuidado e sofisticação. 
              Agende seu horário e descubra o padrão Sergio.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/agendar">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-8 rounded-none uppercase tracking-widest text-sm font-bold w-full sm:w-auto">
                  Agendar Agora
                </Button>
              </Link>
              <Link to="/galeria">
                <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white px-10 py-8 rounded-none uppercase tracking-widest text-sm font-bold w-full sm:w-auto">
                  Ver Galeria
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-[#0a0a0a] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Scissors, title: "Cortes de Precisão", desc: "Técnicas clássicas e modernas para o visual perfeito." },
              { icon: ShieldCheck, title: "Produtos Premium", desc: "Usamos apenas as melhores marcas para o seu cabelo e barba." },
              { icon: Clock, title: "Agendamento Fácil", desc: "Sistema online intuitivo para você não perder tempo." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 group-hover:border-amber-500 transition-colors">
                  <feature.icon className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-widest mb-4">{feature.title}</h3>
                <p className="text-gray-500 font-light">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <span className="text-amber-500 uppercase tracking-widest text-xs font-bold mb-2 block">Nossos Serviços</span>
              <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter italic">Menu de Estilo</h2>
            </div>
            <Link to="/agendar" className="text-amber-500 uppercase tracking-widest text-sm font-bold hover:underline">
              Ver todos os serviços →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { name: "Corte Social", price: "R$ 60", time: "45 min" },
              { name: "Barba Completa", price: "R$ 45", time: "30 min" },
              { name: "Combo (Corte + Barba)", price: "R$ 90", time: "75 min" },
              { name: "Corte Kids", price: "R$ 50", time: "40 min" }
            ].map((service, i) => (
              <div key={i} className="flex justify-between items-center p-8 border border-white/5 hover:border-white/20 transition-colors bg-white/[0.02]">
                <div>
                  <h4 className="text-xl font-bold uppercase tracking-widest mb-1">{service.name}</h4>
                  <span className="text-gray-500 text-xs uppercase tracking-widest">{service.time}</span>
                </div>
                <div className="text-2xl font-black text-amber-500 italic">{service.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Integration (Mock) */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Instagram className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold uppercase tracking-widest mb-2">Siga @obarbeirosergio</h2>
            <p className="text-gray-500">Acompanhe as transformações e novidades diárias.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-square bg-white/5 overflow-hidden group relative">
                <img 
                  src={`https://picsum.photos/seed/barber${n}/600/600`} 
                  alt="Instagram Post" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Instagram className="text-white h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-24 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="flex justify-center space-x-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-5 w-5 text-amber-500 fill-amber-500" />)}
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-widest mb-2">O que dizem nossos clientes</h2>
            <p className="text-gray-500">A satisfação de quem confia no nosso trabalho.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Ricardo Santos", text: "Melhor barbearia da região. O Sergio é extremamente detalhista e o ambiente é nota 10.", rating: 5 },
              { name: "Felipe Oliveira", text: "Atendimento impecável. O sistema de agendamento facilita muito a vida. Recomendo!", rating: 5 },
              { name: "André Luiz", text: "Ambiente premium, café de primeira e o corte sempre perfeito. Fidelidade garantida.", rating: 5 }
            ].map((review, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white/[0.02] border border-white/10 relative"
              >
                <div className="absolute -top-4 left-8 bg-amber-500 text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  Verificado
                </div>
                <p className="text-gray-400 italic mb-6 font-light leading-relaxed">"{review.text}"</p>
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 font-bold">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-widest text-xs">{review.name}</p>
                    <div className="flex space-x-0.5">
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-2 w-2 text-amber-500 fill-amber-500" />)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Info & Location */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold uppercase tracking-tighter mb-6 italic">Onde nos encontrar</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <MapPin className="h-6 w-6 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-widest text-sm">Endereço</p>
                      <p className="text-gray-400">3395 Church St, Vancouver, BC - V5R 4W7</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Phone className="h-6 w-6 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-widest text-sm">Contato</p>
                      <p className="text-gray-400">+1 (236) 512-8846</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Clock className="h-6 w-6 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-widest text-sm">Horário</p>
                      <p className="text-gray-400">Seg - Sex: 10h às 19h<br />Sáb: 10h às 17h<br /><span className="text-[10px] opacity-50 uppercase tracking-tighter">Horário do Pacífico</span></p>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('3395 Church St, Vancouver, BC V5R 4W7')}`, '_blank')}
                className="bg-white text-black hover:bg-gray-200 px-8 rounded-none uppercase tracking-widest font-bold"
              >
                Abrir no Google Maps
              </Button>
            </div>
            <div className="h-[400px] bg-white/5 border border-white/10 relative overflow-hidden">
              {/* Mock Map */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 uppercase tracking-[0.5em] text-xs">
                Mapa Interativo
              </div>
              <img 
                src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2066" 
                alt="Map Placeholder" 
                className="w-full h-full object-cover opacity-20"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

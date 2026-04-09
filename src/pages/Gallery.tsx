import React from 'react';
import { motion } from 'motion/react';
import { Instagram } from 'lucide-react';

export const Gallery: React.FC = () => {
  const images = [
    { url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=2074', title: 'Corte Clássico' },
    { url: 'https://images.unsplash.com/photo-1621605815841-aa88c82b0248?auto=format&fit=crop&q=80&w=2070', title: 'Barba Alinhada' },
    { url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=2070', title: 'Fade Moderno' },
    { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2070', title: 'Ambiente Premium' },
    { url: 'https://images.unsplash.com/photo-1622286332618-f2803b1950d4?auto=format&fit=crop&q=80&w=2070', title: 'Toalha Quente' },
    { url: 'https://images.unsplash.com/photo-1512690196252-741d2fd36ad0?auto=format&fit=crop&q=80&w=2070', title: 'Estilo Sergio' },
    { url: 'https://images.unsplash.com/photo-1593702295094-28258549d32d?auto=format&fit=crop&q=80&w=2070', title: 'Finalização' },
    { url: 'https://images.unsplash.com/photo-1532710093739-9470acff878f?auto=format&fit=crop&q=80&w=2070', title: 'Detalhes' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <span className="text-amber-500 uppercase tracking-[0.3em] text-xs font-bold mb-4 block">Portfólio</span>
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic mb-6">Galeria de Estilo</h1>
        <p className="text-gray-500 max-w-2xl mx-auto font-light">
          Confira alguns dos nossos melhores trabalhos e inspire-se para o seu próximo visual.
          Qualidade e precisão em cada detalhe.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {images.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative aspect-[3/4] overflow-hidden bg-white/5"
          >
            <img 
              src={img.url} 
              alt={img.title} 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
              <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-1">{img.title}</h3>
              <div className="flex items-center text-amber-500 text-xs font-bold uppercase tracking-widest">
                <Instagram className="h-3 w-3 mr-2" /> @obarbeirosergio
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 text-center">
        <a 
          href="https://instagram.com/obarbeirosergio" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-4 bg-white/5 border border-white/10 px-10 py-6 hover:bg-white/10 transition-colors uppercase tracking-[0.2em] font-bold text-sm"
        >
          <Instagram className="h-5 w-5 text-amber-500" />
          <span>Ver mais no Instagram</span>
        </a>
      </div>
    </div>
  );
};

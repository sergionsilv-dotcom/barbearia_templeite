import React from 'react';
import { Instagram, Camera, ExternalLink, Scissors } from 'lucide-react';
import { motion } from 'motion/react';
import { useLocationContext } from '../LocationContext';
import { useTranslation } from 'react-i18next';

export const Gallery: React.FC = () => {
  const { t } = useTranslation();
  const { networkConfig } = useLocationContext();
  const photos = [
    { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2070', title: t('services.social_cut') },
    { url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=2070', title: t('services.beard') },
    { url: 'https://images.unsplash.com/photo-1512690196252-741d2fd36ad0?auto=format&fit=crop&q=80&w=2070', title: 'Service Style' },
    { url: 'https://images.unsplash.com/photo-1599351473219-283ad6afbc0c?auto=format&fit=crop&q=80&w=2070', title: 'Fade Cut' },
    { url: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=2070', title: 'Classic Cut' },
    { url: 'https://images.unsplash.com/photo-1501691223387-dd050040aa39?auto=format&fit=crop&q=80&w=2070', title: 'Hair Design' },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block p-3 bg-amber-500/10 rounded-full mb-6"
          >
            <Camera className="h-8 w-8 text-amber-500" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 italic">
            {t('nav.gallery').split(' ')[0]} <span className="text-amber-500">{t('nav.gallery').split(' ')[1] || ''}</span>
          </h1>
          <p className="text-gray-400 uppercase tracking-[0.3em] text-xs font-bold mb-8">
            Estilo • Atitude • Tradição
          </p>
          <a 
            href={`https://instagram.com/${networkConfig.instagram || 'barbershop'}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors uppercase tracking-widest text-xs font-bold"
          >
            <Instagram className="h-3 w-3 mr-2" /> @{networkConfig.instagram || 'barbershop'}
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {photos.map((photo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-square overflow-hidden bg-white/5 border border-white/10"
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                <Scissors className="h-8 w-8 text-amber-500 mb-4 transform -rotate-45" />
                <h3 className="text-xl font-bold uppercase tracking-widest mb-2 italic">{photo.title}</h3>
                <div className="flex items-center text-xs text-gray-400 uppercase tracking-widest">
                  <ExternalLink className="h-3 w-3 mr-2" /> {t('home.view_gallery')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

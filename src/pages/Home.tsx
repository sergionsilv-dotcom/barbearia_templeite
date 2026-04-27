import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocationContext } from '../LocationContext';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Scissors, CheckCircle2, Clock, Instagram, Star, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const { networkConfig } = useLocationContext();

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
              {t('home.hero_subtitle')}
            </span>
              <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter uppercase leading-[0.9]">
                {(networkConfig.name || 'Barber Pro').split(' ').map((word, i, arr) => (
                  <span key={i} className={i === arr.length - 1 ? "text-amber-500 block" : "block"}>
                    {word}
                  </span>
                ))}
              </h1>
              <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-xl mx-auto font-medium leading-relaxed">
                {networkConfig.slogan || 'Your premium grooming destination.'}. {t('home.hero_cta_text')}
              </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/agendar" className="w-full sm:w-auto">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-8 rounded-none uppercase tracking-widest text-sm font-bold w-full sm:w-auto">
                  {t('home.book_now')}
                </Button>
              </Link>
              <Link to="/galeria" className="w-full sm:w-auto">
                <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white px-10 py-8 rounded-none uppercase tracking-widest text-sm font-bold w-full sm:w-auto">
                  {t('home.view_gallery')}
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
              { icon: Scissors, title: t('home.feat_1_title'), desc: t('home.feat_1_desc') },
              { icon: CheckCircle2, title: t('home.feat_2_title'), desc: t('home.feat_2_desc') },
              { icon: Clock, title: t('home.feat_3_title'), desc: t('home.feat_3_desc') }
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
              <span className="text-amber-500 uppercase tracking-widest text-xs font-bold mb-2 block">{t('home.our_services')}</span>
              <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter italic">{t('home.menu_title')}</h2>
            </div>
            <Link to="/agendar" className="text-amber-500 uppercase tracking-widest text-sm font-bold hover:underline">
              {t('home.view_all_services')} →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { name: t('services.social_cut'), price: t('services.social_cut_price'), time: t('services.social_cut_time') },
              { name: t('services.beard'), price: t('services.beard_price'), time: t('services.beard_time') },
              { name: t('services.combo'), price: t('services.combo_price'), time: t('services.combo_time') },
              { name: t('services.kids'), price: t('services.kids_price'), time: t('services.kids_time') }
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

      {/* Instagram Integration */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Instagram className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold uppercase tracking-widest mb-2">{t('home.follow_us')} @{networkConfig.instagram || 'barbershop'}</h2>
            <p className="text-gray-400 mb-8 uppercase tracking-tighter font-medium italic">{t('home.instagram_desc')}</p>
            <Button 
              size="lg" 
              onClick={() => window.open(`https://instagram.com/${networkConfig.instagram}`, '_blank')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-none uppercase tracking-widest font-black italic shadow-lg shadow-purple-500/20"
            >
              <Instagram className="h-5 w-5 mr-2" />
              {t('home.view_instagram')}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-square bg-white/5 overflow-hidden group relative">
                <img 
                  src={`https://picsum.photos/seed/barber${n}/600/600`} 
                  alt="Gallery" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a 
                    href={`https://instagram.com/${networkConfig.instagram}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors uppercase tracking-widest text-xs font-bold"
                  >
                    <Instagram className="h-3 w-3 mr-2" /> @{networkConfig.instagram || 'barbershop'}
                  </a>
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
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-4 w-4 text-amber-500 fill-amber-500" />)}
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-widest mb-2">{t('home.reviews_title')}</h2>
            <p className="text-gray-500">{t('home.reviews_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: t('home.review_1_name'), text: t('home.review_1_text'), rating: 5 },
              { name: t('home.review_2_name'), text: t('home.review_2_text'), rating: 5 },
              { name: t('home.review_3_name'), text: t('home.review_3_text'), rating: 5 }
            ].map((review, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white/[0.02] border border-white/10 relative"
              >
                <div className="absolute -top-4 left-8 bg-amber-500 text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  {t('common.verified')}
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
                <h2 className="text-4xl font-bold uppercase tracking-tighter mb-6 italic">{t('home.find_us')}</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <MapPin className="h-6 w-6 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-widest text-sm">{t('common.address')}</p>
                      <p className="text-gray-400">Your Address Street, City, State - Zip</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Phone className="h-6 w-6 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-widest text-sm">{t('common.contact')}</p>
                      <p className="text-gray-400">{networkConfig.phone || '+0 (000) 000-0000'}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Clock className="h-6 w-6 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-widest text-sm">{t('common.hours')}</p>
                      <p className="text-gray-400">{t('home.working_hours')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                className="bg-white text-black hover:bg-gray-200 px-8 rounded-none uppercase tracking-widest font-bold"
              >
                {t('home.open_maps')}
              </Button>
            </div>
            <div className="h-[400px] bg-white/5 border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 uppercase tracking-[0.5em] text-xs">
                Interactive Map
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

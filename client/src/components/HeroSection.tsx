import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import useEmblaCarousel from 'embla-carousel-react';
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

import img1 from '@assets/stock_images/luxury_modern_apartm_d0631b09.jpg';
import img2 from '@assets/stock_images/luxury_modern_apartm_6d19a69a.jpg';
import img3 from '@assets/stock_images/beautiful_modern_hou_b9e08fe1.jpg';
import img4 from '@assets/stock_images/beautiful_modern_hou_f99ca0b1.jpg';
import img5 from '@assets/stock_images/elegant_apartment_bu_bd7e0cfa.jpg';
import img6 from '@assets/stock_images/elegant_apartment_bu_0fefac55.jpg';
import img7 from '@assets/stock_images/cozy_bedroom_interio_f0d4b53b.jpg';
import img8 from '@assets/stock_images/cozy_bedroom_interio_dd980b2a.jpg';
import img9 from '@assets/stock_images/luxury_villa_propert_380b5f22.jpg';
import img10 from '@assets/stock_images/luxury_villa_propert_b4ba8611.jpg';

interface AngolaMapPoint {
  x: number;
  y: number;
  delay: number;
}

const carouselImages = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10];

export default function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [isFirstImageLoaded, setIsFirstImageLoaded] = useState(false);
  const [mapPoints] = useState<AngolaMapPoint[]>([
    { x: 45, y: 35, delay: 0.2 },
    { x: 52, y: 42, delay: 0.4 },
    { x: 48, y: 50, delay: 0.6 },
    { x: 55, y: 45, delay: 0.8 },
    { x: 42, y: 55, delay: 1.0 },
    { x: 60, y: 38, delay: 1.2 },
    { x: 50, y: 60, delay: 1.4 },
  ]);

  useEffect(() => {
    const preloadImage = (src: string, index: number, priority: boolean = false) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        if (priority) {
          img.fetchPriority = 'high';
        }
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(index));
          if (index === 0) {
            setIsFirstImageLoaded(true);
          }
          resolve();
        };
        img.onerror = () => {
          setLoadedImages(prev => new Set(prev).add(index));
          if (index === 0) {
            setIsFirstImageLoaded(true);
          }
          resolve();
        };
        img.src = src;
      });
    };

    // Carregar primeira imagem com máxima prioridade
    preloadImage(carouselImages[0], 0, true).then(() => {
      // Carregar próximas 2 imagens rapidamente
      Promise.all([
        preloadImage(carouselImages[1], 1, true),
        preloadImage(carouselImages[2], 2, true)
      ]).then(() => {
        // Carregar o resto gradualmente para não sobrecarregar mobile
        carouselImages.slice(3).forEach((src, idx) => {
          setTimeout(() => {
            preloadImage(src, idx + 3);
          }, idx * 500);
        });
      });
    });
  }, []);

  useEffect(() => {
    if (!isFirstImageLoaded) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isFirstImageLoaded]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {!isFirstImageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-gray-900 to-blue-950/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.1)_0%,_transparent_70%)]" />
        </div>
      )}
      
      <AnimatePresence initial={false}>
        <motion.div
          key={currentImageIndex}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: loadedImages.has(currentImageIndex) 
              ? `url(${carouselImages[currentImageIndex]})` 
              : 'none',
            backgroundColor: loadedImages.has(currentImageIndex) ? 'transparent' : 'hsl(var(--muted))'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: loadedImages.has(currentImageIndex) ? 1 : 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </AnimatePresence>
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <motion.path
            d="M 40 30 L 60 30 L 65 45 L 60 65 L 45 70 L 35 55 L 38 40 Z"
            fill="url(#mapGradient)"
            stroke="hsl(var(--primary))"
            strokeWidth="0.2"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          {mapPoints.map((point, index) => (
            <motion.circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="0.8"
              fill="hsl(var(--primary))"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0.8],
                scale: [0, 1.2, 1]
              }}
              transition={{
                delay: point.delay,
                duration: 0.8,
                ease: "easeOut"
              }}
            >
              <animate
                attributeName="opacity"
                values="0.8;1;0.8"
                dur="2s"
                repeatCount="indefinite"
                begin={`${point.delay}s`}
              />
            </motion.circle>
          ))}
        </svg>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2" data-testid="carousel-indicators">
        {carouselImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentImageIndex 
                ? 'bg-white w-8' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
            data-testid={`carousel-indicator-${index}`}
            aria-label={`Ir para imagem ${index + 1}`}
          />
        ))}
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.p 
            className="text-sm md:text-base text-white/80 mb-4 uppercase tracking-wide drop-shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Plataforma Imobiliária de Angola
          </motion.p>
          
          <motion.h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Encontre o Imóvel Perfeito
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto drop-shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            Conectamos proprietários, inquilinos, compradores e corretores em uma plataforma digital moderna e segura
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <Link to="/imoveis" className="px-8 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover-elevate active-elevate-2 transition-all inline-block text-center min-w-[200px] touch-manipulation" data-testid="button-explore-properties">
              Explorar Imóveis
            </Link>
            <Link to="/cadastro" className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white border border-white/30 rounded-md font-semibold hover-elevate active-elevate-2 transition-all inline-block text-center min-w-[200px] touch-manipulation" data-testid="button-advertise-property">
              Anunciar Imóvel
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
}

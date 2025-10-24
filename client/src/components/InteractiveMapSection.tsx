import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, MapPin, Navigation } from "lucide-react";

import mapBgImage from '@assets/stock_images/aerial_view_city_map_83390299.jpg';

export default function InteractiveMapSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${mapBgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/60 to-background/70" />
      
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Map className="h-5 w-5" />
              <span className="text-sm font-medium">Mapa Interativo</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Explore Imóveis no Mapa
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8">
              Visualize todos os imóveis disponíveis em Angola com nossa integração de mapa interativo. 
              Navegue por bairros, municípios e províncias com facilidade.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                'Localização em tempo real de imóveis',
                'Filtros por área e preço',
                'Visualização de densidade de propriedades',
                'Navegação intuitiva e responsiva'
              ].map((feature, index) => (
                <motion.li
                  key={index}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{feature}</span>
                </motion.li>
              ))}
            </ul>

            <Button size="lg" data-testid="button-explore-map">
              <Navigation className="h-5 w-5 mr-2" />
              Explorar Mapa
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card className="overflow-hidden shadow-2xl">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 200 150" className="w-full h-full p-8">
                    <defs>
                      <linearGradient id="mapBg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    <rect width="200" height="150" fill="url(#mapBg)" rx="8" />
                    
                    <motion.path
                      d="M 80 50 L 120 50 L 130 75 L 120 110 L 90 120 L 70 95 L 75 65 Z"
                      fill="hsl(var(--primary) / 0.1)"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />

                    {[
                      { x: 90, y: 65, size: 4 },
                      { x: 105, y: 70, size: 6 },
                      { x: 95, y: 85, size: 5 },
                      { x: 110, y: 80, size: 4 },
                      { x: 100, y: 95, size: 5 }
                    ].map((point, index) => (
                      <motion.g key={index}>
                        <motion.circle
                          cx={point.x}
                          cy={point.y}
                          r={point.size}
                          fill="hsl(var(--primary))"
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5 + index * 0.15, duration: 0.5 }}
                        >
                          <animate
                            attributeName="opacity"
                            values="1;0.6;1"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </motion.circle>
                        <motion.circle
                          cx={point.x}
                          cy={point.y}
                          r={point.size + 3}
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="1"
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1.5, opacity: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            delay: 0.5 + index * 0.15,
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 0.5
                          }}
                        />
                      </motion.g>
                    ))}
                  </svg>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, MapPin, Navigation } from "lucide-react";

import mapBgImage from '@assets/stock_images/aerial_view_city_map_83390299.jpg';
import mapInterfaceImage from '@assets/stock_images/interactive_map_inte_159a1412.jpg';

export default function InteractiveMapSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${mapBgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/65 to-black/75" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6 border border-white/20">
              <Map className="h-5 w-5" />
              <span className="text-sm font-medium">Mapa Interativo</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Explore Imóveis no Mapa
            </h2>
            
            <p className="text-xl text-white/90 mb-8">
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
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white/90">{feature}</span>
                </motion.li>
              ))}
            </ul>

            <Button size="lg" className="bg-primary border-primary" data-testid="button-explore-map">
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
              <div className="relative aspect-[4/3]">
                <img 
                  src={mapInterfaceImage} 
                  alt="Interface de Mapa Interativo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Building2, MapPin, Search } from "lucide-react";
import bgImage from '@assets/stock_images/modern_apartment_bui_506260cd.jpg';
import residentialImg from '@assets/stock_images/modern_residential_a_a908ff8e.jpg';
import commercialImg from '@assets/stock_images/commercial_office_sp_93bcd7db.jpg';
import landImg from '@assets/stock_images/empty_land_plot_cons_30bc54d4.jpg';

export default function Imoveis() {
  const categories = [
    {
      icon: Home,
      title: "Residencial",
      description: "Apartamentos e casas para viver com conforto e segurança",
      image: residentialImg
    },
    {
      icon: Building2,
      title: "Comercial",
      description: "Espaços comerciais e escritórios em localizações estratégicas",
      image: commercialImg
    },
    {
      icon: MapPin,
      title: "Terrenos",
      description: "Terrenos prontos para construção em diversas regiões",
      image: landImg
    }
  ];

  return (
    <div className="min-h-screen pt-24">
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Nossos Imóveis
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Encontre o imóvel perfeito em Angola. Apartamentos, casas, terrenos e espaços comerciais.
            </p>
            
            <Button size="lg" className="bg-primary border-primary" data-testid="button-search-properties">
              <Search className="h-5 w-5 mr-2" />
              Buscar Imóveis
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="relative p-6 h-full hover-elevate transition-all duration-300 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${category.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/65 to-black/75" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20">
                      <category.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">{category.title}</h3>
                    <p className="text-white/90">{category.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

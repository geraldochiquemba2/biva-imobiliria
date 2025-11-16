import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Home } from "lucide-react";
import type { PaginatedPropertiesResponse } from "@shared/schema";
import PropertyCard from "@/components/PropertyCard";
import bgImage from '@assets/stock_images/modern_apartment_bui_506260cd.jpg';

export default function AltosPadrao() {
  useEffect(() => {
    document.title = "Propriedades Exclusivas - A partir de 300.000 Kz | BIVA";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Descubra propriedades exclusivas em Angola a partir de 300.000 Kz. Apartamentos e casas de luxo para compra e arrendamento.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Descubra propriedades exclusivas em Angola a partir de 300.000 Kz. Apartamentos e casas de luxo para compra e arrendamento.';
      document.head.appendChild(meta);
    }
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Propriedades Exclusivas - A partir de 300.000 Kz | BIVA');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      meta.content = 'Propriedades Exclusivas - A partir de 300.000 Kz | BIVA';
      document.head.appendChild(meta);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Descubra propriedades exclusivas em Angola a partir de 300.000 Kz. Apartamentos e casas de luxo para compra e arrendamento.');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      meta.content = 'Descubra propriedades exclusivas em Angola a partir de 300.000 Kz. Apartamentos e casas de luxo para compra e arrendamento.';
      document.head.appendChild(meta);
    }
  }, []);
  const { data: allProperties, isLoading } = useQuery<PaginatedPropertiesResponse>({
    queryKey: ['/api/properties?minPrice=300000'],
  });

  const properties = (allProperties?.data || []).filter(property => {
    if (property.status !== 'disponivel') return false;
    
    const price = Number(property.price);
    
    // Imóveis de arrendar: apenas a partir de 500.000 Kz
    if (property.type === 'Arrendar' && price < 500000) {
      return false;
    }
    
    // Terrenos: apenas a partir de 100.000.000 Kz
    if (property.category === 'Terreno' && price < 100000000) {
      return false;
    }
    
    return true;
  });

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
              Propriedades Exclusivas
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              A partir de 300.000 Kz
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">

          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Propriedades Exclusivas</h2>
            <p className="text-muted-foreground">
              {isLoading ? "Carregando..." : `${properties?.length || 0} ${properties?.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {properties.map((property, index) => (
                <PropertyCard key={property.id} property={property} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum imóvel encontrado</h3>
              <p className="text-muted-foreground">
                Não há propriedades exclusivas disponíveis no momento.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

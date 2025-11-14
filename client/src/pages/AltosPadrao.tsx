import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, MapPin, Bed, Bath, Maximize2 } from "lucide-react";
import type { PaginatedPropertiesResponse } from "@shared/schema";
import bgImage from '@assets/stock_images/modern_apartment_bui_506260cd.jpg';

export default function AltosPadrao() {
  useEffect(() => {
    document.title = "Imóveis de Alto Padrão - A partir de 300.000 Kz | BIVA";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Descubra imóveis exclusivos de alto padrão em Angola a partir de 300.000 Kz. Apartamentos e casas de luxo para compra e arrendamento.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Descubra imóveis exclusivos de alto padrão em Angola a partir de 300.000 Kz. Apartamentos e casas de luxo para compra e arrendamento.';
      document.head.appendChild(meta);
    }
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Imóveis de Alto Padrão - A partir de 300.000 Kz | BIVA');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      meta.content = 'Imóveis de Alto Padrão - A partir de 300.000 Kz | BIVA';
      document.head.appendChild(meta);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Descubra imóveis exclusivos de alto padrão em Angola a partir de 300.000 Kz. Apartamentos e casas de luxo para compra e arrendamento.');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      meta.content = 'Descubra imóveis exclusivos de alto padrão em Angola a partir de 300.000 Kz. Apartamentos e casas de luxo para compra e arrendamento.';
      document.head.appendChild(meta);
    }
  }, []);
  const { data: allProperties, isLoading } = useQuery<PaginatedPropertiesResponse>({
    queryKey: ['/api/properties?minPrice=300000'],
  });

  const properties = (allProperties?.data || []).filter(property => property.status === 'disponivel');

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
              Imóveis de Alto Padrão
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Propriedades exclusivas a partir de 300.000 Kz
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">

          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Imóveis de Alto Padrão</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {properties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link href={`/imoveis/${property.id}`}>
                    <Card 
                      className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer h-full flex flex-col"
                      data-testid={`card-property-${property.id}`}
                    >
                      <div className="relative w-full aspect-[4/3] sm:aspect-video overflow-hidden bg-muted">
                        {property.images && property.images.length > 0 ? (
                          <img 
                            src={property.images[0]} 
                            alt={property.title}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        ) : (property as any).thumbnail ? (
                          <img 
                            src={(property as any).thumbnail} 
                            alt={property.title}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Home className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-wrap gap-1 sm:gap-2 max-w-[calc(100%-1rem)] sm:max-w-[calc(100%-2rem)]">
                        <Badge className="bg-primary text-primary-foreground text-xs whitespace-nowrap" data-testid={`badge-type-${property.id}`}>
                          {property.type}
                        </Badge>
                        {property.featured && (
                          <Badge variant="secondary" className="text-xs whitespace-nowrap" data-testid={`badge-featured-${property.id}`}>
                            Destaque
                          </Badge>
                        )}
                        <Badge className="bg-amber-600 text-white text-xs whitespace-nowrap" data-testid={`badge-premium-${property.id}`}>
                          Alto Padrão
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 sm:p-6 flex-1 flex flex-col">
                      <div className="mb-2 sm:mb-4">
                        <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 line-clamp-2" data-testid={`text-title-${property.id}`}>
                          {property.title}
                        </h3>
                        <p className="text-primary font-bold text-lg sm:text-2xl mb-1 sm:mb-2" data-testid={`text-price-${property.id}`}>
                          {parseFloat(property.price).toLocaleString('pt-AO')} Kz
                        </p>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="line-clamp-1" data-testid={`text-location-${property.id}`}>
                            {property.bairro}, {property.municipio}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-auto">
                        <div className="flex items-center gap-1">
                          <Bed className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span data-testid={`text-bedrooms-${property.id}`}>{property.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span data-testid={`text-bathrooms-${property.id}`}>{property.bathrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span data-testid={`text-area-${property.id}`}>{property.area}m²</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum imóvel encontrado</h3>
              <p className="text-muted-foreground">
                Não há imóveis de alto padrão disponíveis no momento.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

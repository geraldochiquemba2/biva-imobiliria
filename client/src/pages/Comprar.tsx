import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, MapPin, Bed, Bath, Maximize2 } from "lucide-react";
import type { PaginatedPropertiesResponse } from "@shared/schema";
import bgImage from '@assets/stock_images/modern_apartment_bui_506260cd.jpg';

export default function Comprar() {
  const { data: allProperties, isLoading } = useQuery<PaginatedPropertiesResponse>({
    queryKey: ['/api/properties', { type: 'Vender' }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('type', 'Vender');
      
      const url = `/api/properties?${params.toString()}`;
      
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
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
              Imóveis para Comprar
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Encontre o imóvel perfeito para comprar em Angola.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">

          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Imóveis para Comprar</h2>
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
                          />
                        ) : (property as any).thumbnail ? (
                          <img 
                            src={(property as any).thumbnail} 
                            alt={property.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Home className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-wrap gap-1 sm:gap-2 max-w-[calc(100%-1rem)] sm:max-w-[calc(100%-2rem)]">
                        <Badge className="bg-primary text-primary-foreground text-xs whitespace-nowrap" data-testid={`badge-type-${property.id}`}>
                          Comprar
                        </Badge>
                        {property.featured && (
                          <Badge variant="secondary" className="text-xs whitespace-nowrap" data-testid={`badge-featured-${property.id}`}>
                            Destaque
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-3 sm:p-6 flex-1 flex flex-col">
                      <div className="mb-2 sm:mb-4">
                        <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 line-clamp-2" data-testid={`text-title-${property.id}`}>
                          {property.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.bairro}, {property.municipio}
                        </p>
                      </div>

                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4 line-clamp-2 flex-1">
                        {property.description || 'Sem descrição disponível'}
                      </p>

                      <div className="flex flex-wrap gap-2 sm:gap-3 mb-2 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
                        {property.bedrooms > 0 && (
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            <Bed className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            <span>{property.bedrooms}</span>
                          </div>
                        )}
                        {property.bathrooms > 0 && (
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            <Bath className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            <span>{property.bathrooms}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="whitespace-nowrap">{property.area}m²</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 sm:pt-4 border-t">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">Preço</p>
                          <p className="text-sm sm:text-lg md:text-2xl font-bold text-primary truncate" data-testid={`text-price-${property.id}`}>
                            {Number(property.price).toLocaleString('pt-AO')} AOA
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0" data-testid={`badge-category-${property.id}`}>
                          {property.category}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">Nenhum imóvel encontrado</h3>
              <p className="text-muted-foreground">
                Não há imóveis disponíveis para comprar no momento
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

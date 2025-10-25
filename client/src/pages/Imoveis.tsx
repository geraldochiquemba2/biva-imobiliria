import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, MapPin, Search, Bed, Bath, Maximize2, RotateCcw, Sofa, UtensilsCrossed } from "lucide-react";
import type { Property, SearchPropertyParams } from "@shared/schema";
import bgImage from '@assets/stock_images/modern_apartment_bui_506260cd.jpg';

export default function Imoveis() {
  const [filters, setFilters] = useState<SearchPropertyParams>({});
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.bairro) params.append('bairro', filters.bairro);
      if (filters.municipio) params.append('municipio', filters.municipio);
      if (filters.provincia) params.append('provincia', filters.provincia);
      if (filters.bedrooms !== undefined) params.append('bedrooms', filters.bedrooms.toString());
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.featured !== undefined) params.append('featured', filters.featured.toString());
      
      const queryString = params.toString();
      const url = `/api/properties${queryString ? `?${queryString}` : ''}`;
      
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
  });

  const handleSearch = () => {
    const newFilters: SearchPropertyParams = {};
    
    if (filters.type) newFilters.type = filters.type;
    if (filters.category) newFilters.category = filters.category;
    if (location) newFilters.location = location;
    if (filters.bedrooms !== undefined) newFilters.bedrooms = filters.bedrooms;
    if (minPrice) newFilters.minPrice = Number(minPrice);
    if (maxPrice) newFilters.maxPrice = Number(maxPrice);
    
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
  };

  const handleCategoryChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      category: value as any
    }));
  };

  const hasActiveFilters = filters.type || filters.category || location || filters.bedrooms !== undefined || minPrice || maxPrice;
  const showRoomFilters = filters.category === 'Casa' || filters.category === 'Apartamento';

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
          </motion.div>
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-20 px-6 -mt-20"
      >
        <Card className="max-w-5xl mx-auto p-8 shadow-2xl">
          <div className="flex gap-3 mb-6">
            <Button
              variant={filters.type === 'Arrendar' ? 'default' : 'outline'}
              onClick={() => setFilters(prev => ({ ...prev, type: 'Arrendar' }))}
              className="flex-1 transition-all duration-300"
              data-testid="button-arrendar"
            >
              Arrendar
            </Button>
            <Button
              variant={filters.type === 'Vender' ? 'default' : 'outline'}
              onClick={() => setFilters(prev => ({ ...prev, type: 'Vender' }))}
              className="flex-1 transition-all duration-300"
              data-testid="button-vender"
            >
              Vender
            </Button>
          </div>

          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Localização"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 transition-all duration-200"
                  data-testid="input-location"
                />
              </div>

              <Select value={filters.category || ""} onValueChange={handleCategoryChange}>
                <SelectTrigger className="transition-all duration-200" data-testid="select-category">
                  <Home className="h-5 w-5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Tipo de Imóvel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apartamento">Apartamento</SelectItem>
                  <SelectItem value="Casa">Casa</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Terreno">Terreno</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  placeholder="Preço mín (Kz)"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="transition-all duration-200"
                  data-testid="input-min-price"
                />
                <Input
                  placeholder="Preço máx (Kz)"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="transition-all duration-200"
                  data-testid="input-max-price"
                />
              </div>
            </div>

            {showRoomFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select 
                  value={filters.bedrooms?.toString() || ""} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, bedrooms: Number(value) }))}
                >
                  <SelectTrigger className="transition-all duration-200" data-testid="select-bedrooms">
                    <Bed className="h-5 w-5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Quartos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Estúdio</SelectItem>
                    <SelectItem value="1">1 Quarto</SelectItem>
                    <SelectItem value="2">2 Quartos</SelectItem>
                    <SelectItem value="3">3 Quartos</SelectItem>
                    <SelectItem value="4">4+ Quartos</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="transition-all duration-200" data-testid="select-living-rooms">
                    <Sofa className="h-5 w-5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Salas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Sala</SelectItem>
                    <SelectItem value="2">2 Salas</SelectItem>
                    <SelectItem value="3">3+ Salas</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="transition-all duration-200" data-testid="select-kitchens">
                    <UtensilsCrossed className="h-5 w-5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Cozinhas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Cozinha</SelectItem>
                    <SelectItem value="2">2 Cozinhas</SelectItem>
                    <SelectItem value="3">3+ Cozinhas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              onClick={handleSearch} 
              className="w-full" 
              size="default"
              data-testid="button-search"
            >
              <Search className="h-5 w-5 mr-2" />
              Pesquisar
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Pesquise entre milhares de imóveis em toda Angola
            </div>
            
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover-elevate"
                data-testid="button-reset-filters"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Redefinir Filtros
              </Button>
            )}
          </div>
        </Card>
      </motion.div>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">

          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Imóveis Disponíveis</h2>
            <p className="text-muted-foreground">
              {isLoading ? "Carregando..." : `${properties?.length || 0} ${properties?.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`}
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div className="relative h-64 overflow-hidden">
                        {property.images && property.images.length > 0 ? (
                          <img 
                            src={property.images[0]} 
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Home className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-primary text-primary-foreground" data-testid={`badge-type-${property.id}`}>
                          {property.type}
                        </Badge>
                        {property.featured && (
                          <Badge variant="secondary" data-testid={`badge-featured-${property.id}`}>
                            Destaque
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold mb-2 line-clamp-2" data-testid={`text-title-${property.id}`}>
                          {property.title}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.bairro}, {property.municipio}
                        </p>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                        {property.description || 'Sem descrição disponível'}
                      </p>

                      <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                        {property.bedrooms > 0 && (
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.bedrooms}</span>
                          </div>
                        )}
                        {property.bathrooms > 0 && (
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{property.bathrooms}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Maximize2 className="h-4 w-4" />
                          <span>{property.area}m²</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Preço</p>
                          <p className="text-2xl font-bold text-primary" data-testid={`text-price-${property.id}`}>
                            {Number(property.price).toLocaleString('pt-AO')} AOA
                          </p>
                        </div>
                        <Badge variant="outline" data-testid={`badge-category-${property.id}`}>
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
              <p className="text-muted-foreground mb-6">
                Tente ajustar os filtros para encontrar mais resultados
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} data-testid="button-clear-filters-empty">
                  Limpar Filtros
                </Button>
              )}
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

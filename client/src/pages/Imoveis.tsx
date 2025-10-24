import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Building2, MapPin, Search, Bed, Bath, Maximize2, X } from "lucide-react";
import type { Property, SearchPropertyParams } from "@shared/schema";
import bgImage from '@assets/stock_images/modern_apartment_bui_506260cd.jpg';
import residentialImg from '@assets/stock_images/modern_residential_a_a908ff8e.jpg';
import commercialImg from '@assets/stock_images/commercial_office_sp_93bcd7db.jpg';
import landImg from '@assets/stock_images/empty_land_plot_cons_30bc54d4.jpg';

export default function Imoveis() {
  const [filters, setFilters] = useState<SearchPropertyParams>({});
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    {
      icon: Home,
      title: "Residencial",
      description: "Apartamentos e casas para viver com conforto e segurança",
      image: residentialImg,
      value: "Casa" as const
    },
    {
      icon: Building2,
      title: "Comercial",
      description: "Espaços comerciais e escritórios em localizações estratégicas",
      image: commercialImg,
      value: "Comercial" as const
    },
    {
      icon: MapPin,
      title: "Terrenos",
      description: "Terrenos prontos para construção em diversas regiões",
      image: landImg,
      value: "Terreno" as const
    }
  ];

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
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

  const handleFilterChange = (key: keyof SearchPropertyParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

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
            
            <Button 
              size="lg" 
              className="bg-primary border-primary" 
              data-testid="button-search-properties"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Search className="h-5 w-5 mr-2" />
              {showFilters ? 'Ocultar Filtros' : 'Buscar Imóveis'}
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className="relative p-6 h-full hover-elevate active-elevate-2 transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => handleFilterChange('category', category.value)}
                  data-testid={`card-category-${category.value.toLowerCase()}`}
                >
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

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12"
            >
              <Card className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold">Filtrar Imóveis</h2>
                  {hasActiveFilters && (
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      data-testid="button-clear-filters"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo</label>
                    <Select 
                      value={filters.type || "all"}
                      onValueChange={(value) => handleFilterChange('type', value)}
                    >
                      <SelectTrigger data-testid="select-type">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Vender">Vender</SelectItem>
                        <SelectItem value="Arrendar">Arrendar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoria</label>
                    <Select 
                      value={filters.category || "all"}
                      onValueChange={(value) => handleFilterChange('category', value)}
                    >
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="Apartamento">Apartamento</SelectItem>
                        <SelectItem value="Casa">Casa</SelectItem>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                        <SelectItem value="Terreno">Terreno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Província</label>
                    <Input 
                      placeholder="Ex: Luanda"
                      value={filters.provincia || ""}
                      onChange={(e) => handleFilterChange('provincia', e.target.value || undefined)}
                      data-testid="input-provincia"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Município</label>
                    <Input 
                      placeholder="Ex: Talatona"
                      value={filters.municipio || ""}
                      onChange={(e) => handleFilterChange('municipio', e.target.value || undefined)}
                      data-testid="input-municipio"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Bairro</label>
                    <Input 
                      placeholder="Ex: Camama"
                      value={filters.bairro || ""}
                      onChange={(e) => handleFilterChange('bairro', e.target.value || undefined)}
                      data-testid="input-bairro"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Quartos</label>
                    <Select 
                      value={filters.bedrooms?.toString() || "all"}
                      onValueChange={(value) => handleFilterChange('bedrooms', value === "all" ? undefined : Number(value))}
                    >
                      <SelectTrigger data-testid="select-bedrooms">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Preço Mínimo (AOA)</label>
                    <Input 
                      type="number"
                      placeholder="0"
                      value={filters.minPrice || ""}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                      data-testid="input-min-price"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Preço Máximo (AOA)</label>
                    <Input 
                      type="number"
                      placeholder="Sem limite"
                      value={filters.maxPrice || ""}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                      data-testid="input-max-price"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

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
                  <Card 
                    className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer h-full flex flex-col"
                    data-testid={`card-property-${property.id}`}
                  >
                    <div className="relative h-64 overflow-hidden">
                      {property.image ? (
                        <img 
                          src={property.image} 
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

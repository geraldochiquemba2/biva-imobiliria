import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Home, Loader2, SlidersHorizontal, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PropertyCard from "@/components/PropertyCard";
import { PropertyCardSkeleton } from "@/components/PropertyCardSkeleton";
import type { Property } from "@shared/schema";
import shortTermImage from '@assets/stock_images/modern_apartment_bui_70397924.jpg';

interface PaginatedPropertiesResponse {
  data: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ImoveisCurtaDuracao() {
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 12;

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.append('limit', pageLimit.toString());
    params.append('page', currentPage.toString());
    params.append('status', 'disponivel');
    params.append('approvalStatus', 'aprovado');
    params.append('shortTerm', 'true');
    
    if (searchLocation) {
      params.append('location', searchLocation);
    }
    if (selectedCategory) {
      params.append('category', selectedCategory);
    }
    if (selectedBedrooms) {
      params.append('bedrooms', selectedBedrooms);
    }
    
    return params.toString();
  };

  const { data: propertiesResponse, isLoading } = useQuery<PaginatedPropertiesResponse>({
    queryKey: ['/api/properties', currentPage, searchLocation, selectedCategory, selectedBedrooms, 'shortTerm'],
    queryFn: async () => {
      const response = await fetch(`/api/properties?${buildQueryString()}`);
      if (!response.ok) throw new Error('Falha ao buscar imóveis');
      return response.json();
    },
  });

  const properties = propertiesResponse?.data || [];
  const totalPages = propertiesResponse?.totalPages || 1;

  const handleSearch = () => {
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${shortTermImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Imóveis de Curta Duração
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Encontre acomodações temporárias perfeitas para suas férias ou estadias curtas
            </p>

            <div className="flex items-center gap-1 justify-center text-white/80 mb-8">
              <Calendar className="h-5 w-5" />
              <p className="text-sm">
                Arrendamentos flexíveis sem contratos formais
              </p>
            </div>

            <Card className="p-4 max-w-3xl mx-auto bg-background/95 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Localização (cidade, município, bairro)"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                      data-testid="input-search-location"
                    />
                  </div>
                </div>
                <Button onClick={handleSearch} size="default" className="md:w-auto" data-testid="button-search">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Filtros:</span>
          </div>
          
          <div className="flex flex-wrap gap-3 flex-1">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]" data-testid="select-category">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="Apartamento">Apartamento</SelectItem>
                <SelectItem value="Casa">Casa</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedBedrooms} onValueChange={setSelectedBedrooms}>
              <SelectTrigger className="w-[180px]" data-testid="select-bedrooms">
                <SelectValue placeholder="Quartos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="1">1+ Quarto</SelectItem>
                <SelectItem value="2">2+ Quartos</SelectItem>
                <SelectItem value="3">3+ Quartos</SelectItem>
                <SelectItem value="4">4+ Quartos</SelectItem>
              </SelectContent>
            </Select>

            {(selectedCategory || selectedBedrooms) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedCategory("");
                  setSelectedBedrooms("");
                  setCurrentPage(1);
                }}
                data-testid="button-clear-filters"
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-2xl font-bold mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Tente ajustar os filtros ou buscar por outra localização
            </p>
            <Button onClick={() => {
              setSearchLocation("");
              setSelectedCategory("");
              setSelectedBedrooms("");
              setCurrentPage(1);
            }} data-testid="button-reset-search">
              Limpar Busca
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                {propertiesResponse?.total || 0} {propertiesResponse?.total === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            >
              {properties.map((property, index) => (
                <PropertyCard key={property.id} property={property} index={index} />
              ))}
            </motion.div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

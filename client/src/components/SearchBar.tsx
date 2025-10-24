import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Home, Bed } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SearchBarProps {
  onSearch?: (params: {
    type: 'Arrendar' | 'Vender';
    location: string;
    category: string;
    bedrooms: string;
    minPrice: string;
    maxPrice: string;
  }) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [propertyType, setPropertyType] = useState<'Arrendar' | 'Vender'>('Arrendar');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ type: propertyType, location, category, bedrooms, minPrice, maxPrice });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.9 }}
      className="relative z-20 -mt-24 px-6"
    >
      <Card className="max-w-5xl mx-auto p-8 shadow-2xl">
        <div className="flex gap-3 mb-6">
          <Button
            variant={propertyType === 'Arrendar' ? 'default' : 'outline'}
            onClick={() => setPropertyType('Arrendar')}
            className="flex-1 transition-all duration-300"
            data-testid="button-arrendar"
          >
            Arrendar
          </Button>
          <Button
            variant={propertyType === 'Vender' ? 'default' : 'outline'}
            onClick={() => setPropertyType('Vender')}
            className="flex-1 transition-all duration-300"
            data-testid="button-vender"
          >
            Vender
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Bairro, Município, Província"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 transition-all duration-200"
              data-testid="input-location"
            />
          </div>

          <Select value={category} onValueChange={setCategory}>
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

          <Select value={bedrooms} onValueChange={setBedrooms}>
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

        <div className="text-sm text-muted-foreground text-center">
          Pesquise entre milhares de imóveis em toda Angola
        </div>
      </Card>
    </motion.div>
  );
}

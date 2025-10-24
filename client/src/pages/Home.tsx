import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/HeroSection";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import UserProfileCard from "@/components/UserProfileCard";
import InteractiveMapSection from "@/components/InteractiveMapSection";
import CTASection from "@/components/CTASection";
import type { Property } from "@shared/schema";

// Images for properties without images
import property1 from '@assets/generated_images/Luxury_apartment_in_Luanda_10ff3219.png';
import property2 from '@assets/generated_images/Modern_villa_in_Angola_584197c4.png';
import property3 from '@assets/generated_images/Commercial_office_building_2bf3374e.png';
import property4 from '@assets/generated_images/Penthouse_with_city_view_c36d8f06.png';

// Fallback images for properties without images
const fallbackImages = [property1, property2, property3, property4];

function getPropertyImage(property: Property, index: number): string {
  if (property.image) return property.image;
  return fallbackImages[index % fallbackImages.length];
}

const userProfiles = [
  {
    title: 'Proprietários',
    description: 'Gerenciar contratos e propriedades com facilidade',
    iconType: 'owner' as const
  },
  {
    title: 'Clientes/Inquilinos',
    description: 'Encontrar o imóvel ideal para você',
    iconType: 'client' as const
  },
  {
    title: 'Corretores',
    description: 'Expandir portfólio de clientes e vendas',
    iconType: 'broker' as const
  },
  {
    title: 'Gestores de Imóveis',
    description: 'Otimizar operações e aumentar eficiência',
    iconType: 'manager' as const
  }
];

export default function Home() {
  const [searchParams, setSearchParams] = useState<{
    type?: 'Arrendar' | 'Vender';
    location?: string;
    category?: string;
    bedrooms?: string;
    minPrice?: string;
    maxPrice?: string;
  }>({});
  const [showAll, setShowAll] = useState(false);

  // Build query string from search params
  const queryString = Object.entries(searchParams)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`)
    .join('&');

  const { data: properties = [], isLoading, error } = useQuery<Property[]>({
    queryKey: ['/api/properties', queryString],
    queryFn: async () => {
      const url = queryString ? `/api/properties?${queryString}` : '/api/properties';
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch properties');
      }
      return response.json();
    }
  });

  const handleSearch = (params: {
    type: 'Arrendar' | 'Vender';
    location: string;
    category: string;
    bedrooms: string;
    minPrice: string;
    maxPrice: string;
  }) => {
    const newParams: any = { type: params.type };
    
    if (params.location) {
      newParams.municipio = params.location;
    }
    if (params.category) {
      newParams.category = params.category;
    }
    if (params.bedrooms) {
      newParams.bedrooms = params.bedrooms;
    }
    if (params.minPrice) {
      newParams.minPrice = params.minPrice;
    }
    if (params.maxPrice) {
      newParams.maxPrice = params.maxPrice;
    }
    
    setSearchParams(newParams);
  };

  // Add images to properties that don't have them
  const propertiesWithImages = properties.map((property, index) => ({
    ...property,
    image: getPropertyImage(property, index),
  }));

  // Limit to 10 properties initially
  const displayedProperties = showAll ? propertiesWithImages : propertiesWithImages.slice(0, 10);
  const hasMore = propertiesWithImages.length > 10;

  return (
    <div className="min-h-screen">
      <HeroSection />
      
      <SearchBar onSearch={handleSearch} />

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Imóveis em Destaque
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubra as melhores oportunidades de arrendamento e venda em Angola
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive mb-2">Erro ao carregar imóveis</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Tente novamente mais tarde'}
              </p>
            </div>
          ) : propertiesWithImages.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Nenhum imóvel encontrado
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {displayedProperties.map((property, index) => (
                  <PropertyCard key={property.id} property={property} index={index} />
                ))}
              </div>
              
              {!showAll && hasMore && (
                <motion.div
                  className="flex justify-center mt-12"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <button
                    onClick={() => {
                      setShowAll(true);
                      setTimeout(() => {
                        const section = document.querySelector('section');
                        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover-elevate active-elevate-2 transition-all"
                    data-testid="button-ver-mais"
                  >
                    Ver Mais
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Nossos Usuários
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Soluções personalizadas para cada perfil na plataforma BIVA
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userProfiles.map((profile, index) => (
              <UserProfileCard
                key={profile.iconType}
                title={profile.title}
                description={profile.description}
                iconType={profile.iconType}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <InteractiveMapSection />

      <CTASection />

      <footer className="bg-card border-t py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">BIVA</h3>
              <p className="text-muted-foreground">
                Simplificando a gestão imobiliária em Angola
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Sobre Nós</li>
                <li>Como Funciona</li>
                <li>Preços</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Blog</li>
                <li>Guias</li>
                <li>FAQ</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Suporte</li>
                <li>Parcerias</li>
                <li>Carreiras</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 BIVA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

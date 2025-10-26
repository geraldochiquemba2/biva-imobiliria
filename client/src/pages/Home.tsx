import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/HeroSection";
import IntroSection from "@/components/IntroSection";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import FeaturesSection from "@/components/FeaturesSection";
import InteractiveMapSection from "@/components/InteractiveMapSection";
import CTASection from "@/components/CTASection";
import type { Property } from "@shared/schema";
import logoImage from '@assets/BIVA LOG300.300_1761333109756.png';

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
    provincia?: string;
    municipio?: string;
    category?: string;
    bedrooms?: string;
    livingRooms?: string;
    kitchens?: string;
    minPrice?: string;
    maxPrice?: string;
  }>({});
  const [showAll, setShowAll] = useState(false);

  // Build query string from search params
  const queryString = Object.entries(searchParams)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`)
    .join('&');

  const { data: allProperties = [], isLoading, error } = useQuery<Property[]>({
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

  // Filtrar apenas imóveis disponíveis para páginas públicas
  const properties = allProperties.filter(property => property.status === 'disponivel');

  const handleSearch = (params: {
    type: 'Arrendar' | 'Vender';
    provincia: string;
    municipio: string;
    category: string;
    bedrooms: string;
    livingRooms: string;
    kitchens: string;
    minPrice: string;
    maxPrice: string;
  }) => {
    const newParams: any = {};
    
    if (params.type) {
      newParams.type = params.type;
    }
    if (params.provincia) {
      newParams.provincia = params.provincia;
    }
    if (params.municipio) {
      newParams.municipio = params.municipio;
    }
    if (params.category) {
      newParams.category = params.category;
    }
    if (params.bedrooms) {
      newParams.bedrooms = params.bedrooms;
    }
    if (params.livingRooms) {
      newParams.livingRooms = params.livingRooms;
    }
    if (params.kitchens) {
      newParams.kitchens = params.kitchens;
    }
    if (params.minPrice) {
      newParams.minPrice = params.minPrice;
    }
    if (params.maxPrice) {
      newParams.maxPrice = params.maxPrice;
    }
    
    setSearchParams(newParams);
  };

  // Limit to 10 properties initially
  const displayedProperties = showAll ? properties : properties.slice(0, 10);
  const hasMore = properties.length > 10;

  return (
    <div className="min-h-screen pt-20">
      <HeroSection />
      
      <IntroSection />
      
      <SearchBar />

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
          ) : properties.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Nenhum imóvel encontrado
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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

      <FeaturesSection />

      <InteractiveMapSection />

      <CTASection />

      <footer className="bg-card border-t py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img 
                src={logoImage} 
                alt="BIVA Imobiliária" 
                className="h-16 w-auto mb-4 dark:brightness-0 dark:invert transition-all"
              />
              <p className="text-muted-foreground">
                Simplificando a gestão imobiliária em Angola
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/sobre" className="text-muted-foreground hover:text-primary transition-colors">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href="/servicos" className="text-muted-foreground hover:text-primary transition-colors">
                    Como Funciona
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2">
                <li>
                  <span className="text-muted-foreground cursor-not-allowed opacity-50">Blog</span>
                </li>
                <li>
                  <span className="text-muted-foreground cursor-not-allowed opacity-50">Guias</span>
                </li>
                <li>
                  <span className="text-muted-foreground cursor-not-allowed opacity-50">FAQ</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/contacto" className="text-muted-foreground hover:text-primary transition-colors">
                    Suporte
                  </a>
                </li>
                <li>
                  <span className="text-muted-foreground cursor-not-allowed opacity-50">Parcerias</span>
                </li>
                <li>
                  <span className="text-muted-foreground cursor-not-allowed opacity-50">Carreiras</span>
                </li>
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

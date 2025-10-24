import { motion } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import UserProfileCard from "@/components/UserProfileCard";
import InteractiveMapSection from "@/components/InteractiveMapSection";
import CTASection from "@/components/CTASection";
import type { Property } from "@shared/schema";

// todo: remove mock functionality - replace with real API data
import property1 from '@assets/generated_images/Luxury_apartment_in_Luanda_10ff3219.png';
import property2 from '@assets/generated_images/Modern_villa_in_Angola_584197c4.png';
import property3 from '@assets/generated_images/Commercial_office_building_2bf3374e.png';
import property4 from '@assets/generated_images/Penthouse_with_city_view_c36d8f06.png';

const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Apartamento Luxuoso em Talatona',
    type: 'Arrendar',
    category: 'Apartamento',
    price: 350000,
    location: { bairro: 'Talatona', municipio: 'Belas', provincia: 'Luanda' },
    bedrooms: 3,
    bathrooms: 2,
    area: 145,
    image: property1,
    featured: true
  },
  {
    id: '2',
    title: 'Villa Moderna com Jardim',
    type: 'Vender',
    category: 'Casa',
    price: 45000000,
    location: { bairro: 'Miramar', municipio: 'Luanda', provincia: 'Luanda' },
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    image: property2
  },
  {
    id: '3',
    title: 'Edifício Comercial Centro',
    type: 'Vender',
    category: 'Comercial',
    price: 120000000,
    location: { bairro: 'Maianga', municipio: 'Luanda', provincia: 'Luanda' },
    bedrooms: 0,
    bathrooms: 4,
    area: 850,
    image: property3,
    featured: true
  },
  {
    id: '4',
    title: 'Penthouse Vista Panorâmica',
    type: 'Arrendar',
    category: 'Apartamento',
    price: 500000,
    location: { bairro: 'Ilha de Luanda', municipio: 'Luanda', provincia: 'Luanda' },
    bedrooms: 4,
    bathrooms: 3,
    area: 220,
    image: property4
  }
];

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
  return (
    <div className="min-h-screen">
      <HeroSection />
      
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockProperties.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} />
            ))}
          </div>
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

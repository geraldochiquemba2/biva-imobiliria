import PropertyCard from '../PropertyCard';
import property1 from '@assets/generated_images/Luxury_apartment_in_Luanda_10ff3219.png';

export default function PropertyCardExample() {
  const property = {
    id: '1',
    title: 'Apartamento Moderno em Luanda',
    description: 'Apartamento elegante',
    type: 'Arrendar' as const,
    category: 'Apartamento' as const,
    price: '250000.00',
    bairro: 'Talatona',
    municipio: 'Luanda',
    provincia: 'Luanda',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    image: property1,
    featured: true,
    ownerId: 'mock-owner',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return (
    <div className="max-w-sm p-4">
      <PropertyCard property={property} index={0} />
    </div>
  );
}

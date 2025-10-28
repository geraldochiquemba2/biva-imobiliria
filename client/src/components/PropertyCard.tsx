import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Maximize, Home } from "lucide-react";
import type { Property } from "@shared/schema";
import PropertyImage from "@/components/PropertyImage";

interface PropertyCardProps {
  property: Property;
  index: number;
}

export default function PropertyCard({ property, index }: PropertyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/imoveis/${property.id}`}>
        <Card 
          className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer"
          data-testid={`card-property-${property.id}`}
        >
        <div className="relative aspect-square overflow-hidden">
          {property.images && property.images.length > 0 ? (
            <PropertyImage
              src={property.images[0]}
              alt={property.title}
              className="transition-transform duration-500 hover:scale-110"
            />
          ) : (property as any).thumbnail ? (
            <PropertyImage
              src={(property as any).thumbnail}
              alt={property.title}
              className="transition-transform duration-500 hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Home className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-1.5 left-1.5">
            <Badge variant={property.type === 'Arrendar' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
              {property.type === 'Arrendar' ? 'Disponível para arrendar' : property.type === 'Vender' ? 'Disponível para compra' : property.type}
            </Badge>
          </div>
          {property.featured && (
            <div className="absolute top-1.5 right-1.5">
              <Badge className="bg-yellow-500 text-yellow-950 border-yellow-600 text-[10px] px-1.5 py-0.5">
                Destaque
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-3">
          <div className="mb-1.5">
            <h3 className="text-sm font-semibold mb-0.5 line-clamp-1" data-testid={`text-title-${property.id}`}>
              {property.title}
            </h3>
            <div className="flex items-center text-muted-foreground text-[11px] mb-1.5">
              <MapPin className="h-2.5 w-2.5 mr-0.5 flex-shrink-0" />
              <span className="line-clamp-1" data-testid={`text-location-${property.id}`}>
                {property.bairro}, {property.municipio}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <Bed className="h-2.5 w-2.5" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Bath className="h-2.5 w-2.5" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Maximize className="h-2.5 w-2.5" />
              <span>{property.area}m²</span>
            </div>
          </div>

          <div className="text-base font-bold text-primary" data-testid={`text-price-${property.id}`}>
            {parseFloat(property.price).toLocaleString('pt-AO')} Kz
            {property.type === 'Arrendar' && <span className="text-xs font-normal text-muted-foreground">/mês</span>}
          </div>
        </CardContent>
      </Card>
      </Link>
    </motion.div>
  );
}

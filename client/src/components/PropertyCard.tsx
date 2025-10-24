import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Maximize } from "lucide-react";
import type { Property } from "@shared/schema";

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
      <Card 
        className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer"
        data-testid={`card-property-${property.id}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={property.image || ''}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
          <div className="absolute top-2 left-2">
            <Badge variant={property.type === 'Arrendar' ? 'default' : 'secondary'} className="text-xs">
              {property.type}
            </Badge>
          </div>
          {property.featured && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-yellow-500 text-yellow-950 border-yellow-600 text-xs">
                Destaque
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="mb-2">
            <h3 className="text-base font-semibold mb-1 line-clamp-1" data-testid={`text-title-${property.id}`}>
              {property.title}
            </h3>
            <div className="flex items-center text-muted-foreground text-xs mb-2">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="line-clamp-1" data-testid={`text-location-${property.id}`}>
                {property.bairro}, {property.municipio}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-3 w-3" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Maximize className="h-3 w-3" />
              <span>{property.area}m²</span>
            </div>
          </div>

          <div className="text-lg font-bold text-primary" data-testid={`text-price-${property.id}`}>
            {parseFloat(property.price).toLocaleString('pt-AO')} Kz
            {property.type === 'Arrendar' && <span className="text-sm font-normal text-muted-foreground">/mês</span>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

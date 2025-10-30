import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, Maximize, Home, Share2, Link2, Mail } from "lucide-react";
import { SiWhatsapp, SiFacebook } from "react-icons/si";
import type { Property } from "@shared/schema";
import PropertyImage from "@/components/PropertyImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface PropertyCardProps {
  property: Property;
  index: number;
}

export default function PropertyCard({ property, index }: PropertyCardProps) {
  const { toast } = useToast();

  const getPropertyUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/imoveis/${property.id}`;
    }
    return '';
  };

  const handleShare = (platform: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = getPropertyUrl();
    const text = `${property.title} - ${property.bairro}, ${property.municipio}`;
    
    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência.",
        });
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
        break;
    }
  };

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
          <div className="absolute top-1.5 right-1.5 flex gap-1.5">
            {property.featured && (
              <Badge className="bg-yellow-500 text-yellow-950 border-yellow-600 text-[10px] px-1.5 py-0.5">
                Destaque
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 rounded-full bg-white/90 hover:bg-white shadow-sm"
                  data-testid={`button-share-${property.id}`}
                >
                  <Share2 className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={handleShare('copy')} data-testid="button-copy-link">
                  <Link2 className="h-4 w-4" />
                  <span>Copiar link</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleShare('whatsapp')} data-testid="button-share-whatsapp">
                  <SiWhatsapp className="h-4 w-4" />
                  <span>WhatsApp</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare('facebook')} data-testid="button-share-facebook">
                  <SiFacebook className="h-4 w-4" />
                  <span>Facebook</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare('email')} data-testid="button-share-email">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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

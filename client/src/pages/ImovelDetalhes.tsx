import { useEffect, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PropertyWithOwner, User } from "@shared/schema";
import MapView from "@/components/MapView";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Home,
  ChefHat,
  Calendar,
  Phone,
  Mail,
  Share2,
  User as UserIcon,
} from "lucide-react";

export default function ImovelDetalhes() {
  const [, params] = useRoute("/imoveis/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const { data: property, isLoading, error } = useQuery<PropertyWithOwner>({
    queryKey: ['/api/properties', params?.id],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${params?.id}`);
      if (!response.ok) {
        throw new Error('Imóvel não encontrado');
      }
      return response.json();
    },
    enabled: !!params?.id,
  });

  const createVisitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/visits', {
        propertyId: property!.id,
        clienteId: currentUser!.id,
        dataHora: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'agendada',
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visits'] });
      toast({
        title: "Visita agendada!",
        description: "Entraremos em contato para confirmar a data e horário",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao agendar visita",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const handleScheduleVisit = () => {
    if (!currentUser) {
      setLocation('/login');
      toast({
        title: "Faça login para agendar visita",
        description: "Você precisa estar logado para agendar visitas",
      });
      return;
    }
    createVisitMutation.mutate();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        text: property?.description || undefined,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link do imóvel foi copiado para a área de transferência",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Imóvel não encontrado</h2>
          <p className="text-muted-foreground mb-6">O imóvel que você procura não existe ou foi removido</p>
          <Button asChild>
            <Link href="/imoveis">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Imóveis
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const images = property.images || [];
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            className="mb-6"
            asChild
            data-testid="button-back"
          >
            <Link href="/imoveis">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Imóveis
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Esquerda - Imagens e Detalhes */}
            <div className="lg:col-span-2 space-y-6">
              {/* Galeria de Imagens */}
              {hasImages ? (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                    <img
                      src={images[selectedImageIndex]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      data-testid="img-main"
                    />
                  </div>
                  
                  {images.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative aspect-video rounded-md overflow-hidden ${
                            selectedImageIndex === index ? 'ring-2 ring-primary' : ''
                          }`}
                          data-testid={`button-thumbnail-${index}`}
                        >
                          <img
                            src={image}
                            alt={`${property.title} - ${index + 1}`}
                            className="w-full h-full object-cover hover-elevate"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video rounded-md bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">Sem imagens disponíveis</p>
                </div>
              )}

              {/* Descrição */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Descrição</h2>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-description">
                    {property.description || "Sem descrição disponível"}
                  </p>
                </CardContent>
              </Card>

              {/* Características */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Características</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <Maximize className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Área</p>
                        <p className="font-semibold" data-testid="text-area">{property.area} m²</p>
                      </div>
                    </div>

                    {property.category === 'Casa' || property.category === 'Apartamento' ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                            <Bed className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Quartos</p>
                            <p className="font-semibold" data-testid="text-bedrooms">{property.bedrooms}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                            <Bath className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Banheiros</p>
                            <p className="font-semibold" data-testid="text-bathrooms">{property.bathrooms}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                            <Home className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Salas</p>
                            <p className="font-semibold" data-testid="text-livingrooms">{property.livingRooms}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                            <ChefHat className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Cozinhas</p>
                            <p className="font-semibold" data-testid="text-kitchens">{property.kitchens}</p>
                          </div>
                        </div>
                      </>
                    ) : null}

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Categoria</p>
                        <p className="font-semibold" data-testid="text-category">{property.category}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Localização */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Localização</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-semibold" data-testid="text-full-location">
                          {property.bairro}, {property.municipio}, {property.provincia}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Província: {property.provincia}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Município: {property.municipio}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Bairro: {property.bairro}
                        </p>
                      </div>
                    </div>
                    
                    {property.latitude && property.longitude && (
                      <div className="mt-4">
                        <MapView
                          latitude={parseFloat(property.latitude)}
                          longitude={parseFloat(property.longitude)}
                          title={property.title}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita - Informações e Ações */}
            <div className="space-y-6">
              <Card className="sticky top-28">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={property.type === 'Arrendar' ? 'default' : 'secondary'} data-testid="badge-type">
                        {property.type}
                      </Badge>
                      {property.featured && (
                        <Badge className="bg-yellow-500 text-yellow-950 border-yellow-600">
                          Destaque
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold mb-2" data-testid="text-title">
                      {property.title}
                    </h1>
                    <div className="flex items-center text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span data-testid="text-location">
                        {property.bairro}, {property.municipio}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Preço</p>
                    <p className="text-4xl font-bold text-primary" data-testid="text-price">
                      {parseFloat(property.price).toLocaleString('pt-AO')} Kz
                      {property.type === 'Arrendar' && (
                        <span className="text-lg font-normal text-muted-foreground">/mês</span>
                      )}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleScheduleVisit}
                      disabled={createVisitMutation.isPending}
                      data-testid="button-schedule-visit"
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      {createVisitMutation.isPending ? "Agendando..." : "Agendar Visita"}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      size="lg"
                      asChild
                      data-testid="button-contact"
                    >
                      <a href={`tel:${property.owner?.phone || ''}`}>
                        <Phone className="h-5 w-5 mr-2" />
                        Ligar Agora
                      </a>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleShare}
                      data-testid="button-share"
                    >
                      <Share2 className="h-5 w-5 mr-2" />
                      Compartilhar
                    </Button>
                  </div>

                  <Separator />

                  {property.owner && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Publicado por</p>
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={property.owner.profileImage || undefined} />
                          <AvatarFallback>
                            {property.owner.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <p className="font-medium text-sm" data-testid="text-owner-name">
                              {property.owner.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {property.owner.userTypes?.includes('proprietario') ? 'Proprietário' : 
                               property.owner.userTypes?.includes('corretor') ? 'Corretor' : 
                               property.owner.userTypes?.join(' • ')}
                            </p>
                          </div>
                          <div className="space-y-1.5 text-sm">
                            {property.owner.email && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate" data-testid="text-owner-email">{property.owner.email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                              <span data-testid="text-owner-phone">{property.owner.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

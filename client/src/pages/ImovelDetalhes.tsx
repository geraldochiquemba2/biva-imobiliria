import { useEffect, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PropertyWithOwner, User, VirtualTourWithRooms } from "@shared/schema";
import MapView from "@/components/MapView";
import VirtualTourViewer from "@/components/VirtualTourViewer";
import PropertyImage from "@/components/PropertyImage";
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
  Navigation,
  XCircle,
  Eye,
  Edit,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Visit {
  id: string;
  propertyId: string;
  clienteId: string;
  requestedDateTime: string;
  scheduledDateTime?: string | null;
  ownerProposedDateTime?: string | null;
  status: string;
  lastActionBy?: string | null;
  clientMessage?: string | null;
  ownerMessage?: string | null;
  observacoes: string | null;
  createdAt: string;
}

export default function ImovelDetalhes() {
  const [, params] = useRoute("/imoveis/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

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

  // Prefetch similar properties for better navigation UX
  useEffect(() => {
    if (property) {
      // Build query string for similar properties
      const params = new URLSearchParams({
        municipio: property.municipio,
        type: property.type,
        limit: '6',
      });
      
      // Prefetch similar properties based on location and type
      queryClient.prefetchQuery({
        queryKey: [`/api/properties?${params.toString()}`],
      });
    }
  }, [property]);

  // Pré-carregar imagens para melhor performance em mobile
  useEffect(() => {
    if (!property?.images || property.images.length === 0) return;

    const images = property.images;
    
    const preloadImage = (src: string, index: number, priority: boolean = false) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        if (priority) {
          img.fetchPriority = 'high';
        }
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(index));
          resolve();
        };
        img.onerror = () => {
          setLoadedImages(prev => new Set(prev).add(index));
          resolve();
        };
        img.src = src;
      });
    };

    // Carregar primeira imagem com alta prioridade
    preloadImage(images[0], 0, true).then(() => {
      // Carregar próximas 2 imagens imediatamente
      const immediateLoads = images.slice(1, 3).map((src, idx) => 
        preloadImage(src, idx + 1, true)
      );
      
      Promise.all(immediateLoads).then(() => {
        // Carregar o resto com delay para não sobrecarregar
        images.slice(3).forEach((src, idx) => {
          setTimeout(() => {
            preloadImage(src, idx + 3);
          }, idx * 300);
        });
      });
    });
  }, [property?.images]);

  const { data: visitsResponse } = useQuery<{ data: Visit[] }>({
    queryKey: ['/api/properties', params?.id, 'visits'],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${params?.id}/visits`);
      if (!response.ok) return { data: [] };
      return response.json();
    },
    enabled: !!currentUser && !!params?.id,
  });

  const userVisits = visitsResponse?.data || [];

  const { data: virtualTour } = useQuery<VirtualTourWithRooms>({
    queryKey: ['/api/virtual-tours/property', params?.id],
    enabled: !!params?.id,
  });

  // Verificar se usuário não autenticado está tentando ver imóvel indisponível
  useEffect(() => {
    if (property && !currentUser && property.status !== 'disponivel') {
      setLocation('/imoveis');
      toast({
        title: "Imóvel indisponível",
        description: "Este imóvel não está disponível para visualização pública",
        variant: "destructive",
      });
    }
  }, [property, currentUser, setLocation, toast]);

  // Adicionar meta tags Open Graph para partilha social
  useEffect(() => {
    if (!property) return;

    const url = window.location.href;
    const imageUrl = property.images && property.images.length > 0 
      ? property.images[0] 
      : '';
    const description = property.description || `${property.title} - ${property.bairro}, ${property.municipio}`;
    const price = `${parseFloat(property.price).toLocaleString('pt-AO')} Kz${property.type === 'Arrendar' ? '/mês' : ''}`;

    // Atualizar título da página
    document.title = `${property.title} - BIVA Imobiliária`;

    // Função para atualizar ou criar meta tag
    const setMetaTag = (property: string, content: string, isProperty = true) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Open Graph tags
    setMetaTag('og:title', property.title);
    setMetaTag('og:description', `${description} - ${price}`);
    setMetaTag('og:url', url);
    setMetaTag('og:type', 'website');
    if (imageUrl) {
      setMetaTag('og:image', imageUrl);
      setMetaTag('og:image:width', '1200');
      setMetaTag('og:image:height', '630');
    }

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image', false);
    setMetaTag('twitter:title', property.title, false);
    setMetaTag('twitter:description', `${description} - ${price}`, false);
    if (imageUrl) {
      setMetaTag('twitter:image', imageUrl, false);
    }

    // Meta description padrão
    setMetaTag('description', `${description} - ${price}`, false);

    // Cleanup: remover meta tags ao desmontar
    return () => {
      document.title = 'BIVA Imobiliária';
    };
  }, [property]);

  const createVisitMutation = useMutation({
    mutationFn: async () => {
      const requestedDateTime = new Date(`${selectedDate}T${selectedTime}`).toISOString();
      const res = await apiRequest('POST', '/api/visits', {
        propertyId: property!.id,
        clienteId: currentUser!.id,
        requestedDateTime,
      });
      return await res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['/api/visits'] });
      
      const previousVisits = queryClient.getQueryData<Visit[]>(['/api/visits']);
      
      const newVisit: Visit = {
        id: 'temp-' + Date.now(),
        propertyId: property!.id,
        clienteId: currentUser!.id,
        requestedDateTime: new Date(`${selectedDate}T${selectedTime}`).toISOString(),
        status: 'pendente_proprietario',
        observacoes: null,
        createdAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Visit[]>(
        ['/api/visits'],
        (old = []) => [newVisit, ...old]
      );
      
      return { previousVisits };
    },
    onSuccess: () => {
      setShowScheduleDialog(false);
      setSelectedDate("");
      setSelectedTime("");
      toast({
        title: "Solicitação enviada!",
        description: "O proprietário receberá sua solicitação de visita e responderá em breve",
      });
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousVisits) {
        queryClient.setQueryData(['/api/visits'], context.previousVisits);
      }
      toast({
        title: "Erro ao solicitar visita",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visits'] });
    },
  });

  const cancelVisitMutation = useMutation({
    mutationFn: async (visitId: string) => {
      const res = await apiRequest('PATCH', `/api/visits/${visitId}`, {
        status: 'cancelada',
      });
      return await res.json();
    },
    onMutate: async (visitId) => {
      await queryClient.cancelQueries({ queryKey: ['/api/visits'] });
      
      const previousVisits = queryClient.getQueryData<Visit[]>(['/api/visits']);
      
      queryClient.setQueryData<Visit[]>(
        ['/api/visits'],
        (old = []) => old.map(v => v.id === visitId ? { ...v, status: 'cancelada' } : v)
      );
      
      return { previousVisits };
    },
    onSuccess: () => {
      toast({
        title: "Agendamento cancelado",
        description: "Sua solicitação de visita foi cancelada",
      });
    },
    onError: (_error, _vars, context) => {
      if (context?.previousVisits) {
        queryClient.setQueryData(['/api/visits'], context.previousVisits);
      }
      toast({
        title: "Erro ao cancelar agendamento",
        description: "Não foi possível cancelar. Tente novamente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visits'] });
    },
  });

  const handleScheduleVisit = () => {
    if (!currentUser) {
      sessionStorage.setItem('returnUrl', window.location.pathname);
      setLocation('/login');
      toast({
        title: "Faça login para agendar visita",
        description: "Você precisa estar logado para agendar visitas",
      });
      return;
    }
    setShowScheduleDialog(true);
  };

  const handleConfirmSchedule = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Preencha todos os campos",
        description: "Por favor, selecione uma data e horário para a visita",
        variant: "destructive",
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

  const handleGetDirections = () => {
    if (!property?.latitude || !property?.longitude) {
      toast({
        title: "Localização indisponível",
        description: "Este imóvel não possui coordenadas cadastradas",
        variant: "destructive",
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização",
        variant: "destructive",
      });
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setShowRoute(true);
        setLoadingLocation(false);
        toast({
          title: "Rota calculada!",
          description: "A rota foi traçada no mapa",
        });
      },
      (error) => {
        setLoadingLocation(false);
        toast({
          title: "Erro ao obter localização",
          description: "Não foi possível acessar sua localização. Verifique as permissões do navegador.",
          variant: "destructive",
        });
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Imóvel não encontrado</h2>
          <p className="text-muted-foreground mb-6">O imóvel que você procura não existe ou foi removido</p>
          <Button asChild>
            <Link to="/explorar-mapa">
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
  const isOwner = currentUser && property.ownerId === currentUser.id;

  const hasConfirmedVisit = userVisits?.some(
    visit => visit.propertyId === property.id && visit.status === 'agendada'
  );

  const activeVisit = userVisits?.find(
    visit => visit.propertyId === property.id && 
    ['pendente_proprietario', 'pendente_cliente', 'agendada'].includes(visit.status)
  );

  const handleCancelVisit = () => {
    if (activeVisit) {
      cancelVisitMutation.mutate(activeVisit.id);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
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
            <Link to="/explorar-mapa">
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
                  <div className="relative aspect-video rounded-md bg-muted flex items-center justify-center group" data-testid="img-main">
                    <PropertyImage
                      src={selectedImageIndex === 0 && (property as any).thumbnail ? (property as any).thumbnail : images[selectedImageIndex]}
                      alt={property.title}
                      className="w-full h-full"
                    />

                    {/* Botão de navegação */}
                    {images.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white z-10 hover:bg-black/70 active:bg-black/70 no-default-hover-elevate no-default-active-elevate transform-none"
                        onClick={() => setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                        data-testid="button-next-image"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative aspect-video rounded-md overflow-hidden hover-elevate ${
                            selectedImageIndex === index ? 'ring-2 ring-primary' : ''
                          }`}
                          data-testid={`button-thumbnail-${index}`}
                        >
                          {!loadedImages.has(index) && (
                            <div className="absolute inset-0 bg-muted animate-pulse" />
                          )}
                          <img
                            src={index === 0 && (property as any).thumbnail ? (property as any).thumbnail : image}
                            alt={`${property.title} - ${index + 1}`}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${
                              loadedImages.has(index) ? 'opacity-100' : 'opacity-0'
                            }`}
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (property as any).thumbnail ? (
                <div className="aspect-video rounded-md bg-muted flex items-center justify-center" data-testid="img-main">
                  <PropertyImage
                    src={(property as any).thumbnail}
                    alt={property.title}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-md bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">Sem imagens disponíveis</p>
                </div>
              )}

              {/* Tour Virtual 360° */}
              {virtualTour && virtualTour.rooms && virtualTour.rooms.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">Tour Virtual 360°</h2>
                      {currentUser && property.ownerId === currentUser.id && (
                        <Link to={`/imoveis/${property.id}/tour-virtual`}>
                          <Button variant="outline" size="sm" data-testid="button-manage-tour">
                            <Edit className="h-4 w-4 mr-2" />
                            Gerenciar Tour
                          </Button>
                        </Link>
                      )}
                    </div>
                    <VirtualTourViewer tour={virtualTour} />
                  </CardContent>
                </Card>
              )}

              {/* Botão para criar tour (apenas para proprietário) */}
              {!virtualTour && currentUser && property.ownerId === currentUser.id && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Adicione um Tour Virtual 360°</h3>
                    <p className="text-muted-foreground mb-4">
                      Mostre seu imóvel de forma interativa com fotos 360° e hotspots navegáveis
                    </p>
                    <Link to={`/imoveis/${property.id}/tour-virtual`}>
                      <Button data-testid="button-create-tour">
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Tour Virtual
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
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
                        {property.type === 'Arrendar' ? 'Disponível para arrendar' : property.type === 'Vender' ? 'Disponível para compra' : property.type}
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

                  {isOwner ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-md">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Home className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-primary mb-1" data-testid="text-owner-message">
                              Este imóvel é seu
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Você é o proprietário deste imóvel
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleShare}
                        data-testid="button-share"
                      >
                        <Share2 className="h-5 w-5 mr-2" />
                        Compartilhar
                      </Button>

                      <Button
                        variant="default"
                        className="w-full"
                        asChild
                        data-testid="button-edit-property"
                      >
                        <Link to={`/editar-imovel/${property.id}`}>
                          Editar Imóvel
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeVisit ? (
                        <Button
                          variant="destructive"
                          className="w-full"
                          size="lg"
                          onClick={handleCancelVisit}
                          disabled={cancelVisitMutation.isPending}
                          data-testid="button-cancel-visit"
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          {cancelVisitMutation.isPending ? "Cancelando..." : "Cancelar Agendamento"}
                        </Button>
                      ) : (
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
                      )}

                      {hasConfirmedVisit && (
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
                      )}

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
                  )}

                  {!isOwner && property.owner && (
                    <>
                      <Separator />
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
                            {hasConfirmedVisit && (
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
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent data-testid="dialog-schedule-visit">
          <DialogHeader>
            <DialogTitle>Solicitar Visita</DialogTitle>
            <DialogDescription>
              Escolha a data e horário de sua preferência. O proprietário receberá sua solicitação e poderá aceitar, recusar ou propor uma data alternativa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="visit-date">Data</Label>
              <Input
                id="visit-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                data-testid="input-visit-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit-time">Horário</Label>
              <Input
                id="visit-time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                data-testid="input-visit-time"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowScheduleDialog(false)}
              data-testid="button-cancel-schedule"
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirmSchedule}
              disabled={createVisitMutation.isPending}
              data-testid="button-confirm-schedule"
            >
              {createVisitMutation.isPending ? "Enviando..." : "Solicitar Visita"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
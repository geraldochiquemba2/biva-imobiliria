import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { User, Property } from "@shared/schema";
import { 
  ArrowLeft, 
  MapPin, 
  Home,
  Eye,
  Edit,
  MoreVertical,
  Trash2,
  CheckCircle,
  HandCoins,
  ShoppingCart
} from "lucide-react";
import buildingImg from '@assets/stock_images/modern_apartment_bui_70397924.jpg';
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ImoveisIndisponiveis() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/users', currentUser?.id, 'properties'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${currentUser?.id}/properties`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    enabled: !!currentUser?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ propertyId, status }: { propertyId: string; status: string }) => {
      return await apiRequest('PATCH', `/api/properties/${propertyId}`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser?.id, 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      const statusMessages: Record<string, string> = {
        'disponivel': 'disponível',
        'indisponivel': 'indisponível',
        'arrendado': 'arrendado',
        'vendido': 'vendido',
      };
      toast({
        title: "Sucesso",
        description: `Imóvel marcado como ${statusMessages[variables.status]}`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do imóvel",
        variant: "destructive",
      });
    }
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      return await apiRequest('DELETE', `/api/properties/${propertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser?.id, 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Sucesso",
        description: "Imóvel eliminado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao eliminar imóvel",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (!userLoading && !currentUser) {
      setLocation('/login');
    }
  }, [currentUser, userLoading, setLocation]);

  if (userLoading || propertiesLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const userProperties = properties;

  const unavailableProperties = userProperties.filter(p => p.status === 'indisponivel');
  
  const propertiesByStatus = {
    disponivel: userProperties.filter(p => p.status === 'disponivel'),
    arrendado: userProperties.filter(p => p.status === 'arrendado'),
    vendido: userProperties.filter(p => p.status === 'vendido'),
    indisponivel: userProperties.filter(p => p.status === 'indisponivel'),
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${buildingImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Imóveis Indisponíveis
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              {unavailableProperties.length} {unavailableProperties.length === 1 ? 'imóvel indisponível' : 'imóveis indisponíveis'}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Button
            variant="ghost"
            asChild
            className="mb-6"
            data-testid="button-back"
          >
            <Link href="/meus-imoveis">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Link href="/imoveis-disponiveis">
              <Card className="relative overflow-hidden hover-elevate active-elevate-2 cursor-pointer">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-10"
                  style={{ backgroundImage: `url(${buildingImg})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-bold text-green-600">
                    {propertiesByStatus.disponivel.length}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/imoveis-arrendados">
              <Card className="relative overflow-hidden hover-elevate active-elevate-2 cursor-pointer">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-10"
                  style={{ backgroundImage: `url(${buildingImg})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium">Arrendados</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-bold text-blue-600">
                    {propertiesByStatus.arrendado.length}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/imoveis-vendidos">
              <Card className="relative overflow-hidden hover-elevate active-elevate-2 cursor-pointer">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-10"
                  style={{ backgroundImage: `url(${buildingImg})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium">Vendidos</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-bold text-purple-600">
                    {propertiesByStatus.vendido.length}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/imoveis-indisponiveis">
              <Card className="relative overflow-hidden hover-elevate active-elevate-2 cursor-pointer border-2 border-gray-500">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-10"
                  style={{ backgroundImage: `url(${buildingImg})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-transparent" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium">Indisponíveis</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-bold text-gray-600">
                    {unavailableProperties.length}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {unavailableProperties.length === 0 ? (
            <Card className="relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: `url(${buildingImg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-transparent" />
              <CardContent className="text-center py-16 relative z-10">
                <Home className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-2xl font-bold mb-2">
                  Nenhum imóvel indisponível
                </h3>
                <p className="text-muted-foreground">
                  Você não possui imóveis indisponíveis no momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {unavailableProperties.map((property) => (
                <Card key={property.id} className="hover-elevate overflow-hidden">
                  <div className="flex gap-4">
                    <div 
                      className="w-32 h-32 bg-cover bg-center flex-shrink-0"
                      style={{ backgroundImage: `url(${property.images && property.images.length > 0 ? property.images[0] : buildingImg})` }}
                    />
                    <div className="flex-1 py-4 pr-4">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1" data-testid={`text-title-${property.id}`}>
                            {property.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.bairro}, {property.municipio}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-gray-600" data-testid={`badge-status-${property.id}`}>Indisponível</Badge>
                          <Badge data-testid={`badge-type-${property.id}`}>
                            {property.type === 'Arrendar' ? 'Disponível para arrendar' : property.type === 'Vender' ? 'Disponível para compra' : property.type}
                          </Badge>
                          <Badge variant="outline" data-testid={`badge-category-${property.id}`}>
                            {property.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          {property.bedrooms > 0 && (
                            <div>{property.bedrooms} quartos</div>
                          )}
                          {property.bathrooms > 0 && (
                            <div>{property.bathrooms} casas de banho</div>
                          )}
                          <div>{property.area}m²</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Preço</p>
                            <p className="text-xl font-bold" data-testid={`text-price-${property.id}`}>
                              {Number(property.price).toLocaleString('pt-AO', {
                                style: 'currency',
                                currency: 'AOA',
                              })}
                            </p>
                          </div>
                          <Button variant="outline" size="icon" asChild data-testid={`button-view-${property.id}`}>
                            <Link href={`/imoveis/${property.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" data-testid={`button-actions-${property.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild data-testid={`action-edit-${property.id}`}>
                                <Link href={`/editar-imovel/${property.id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar Imóvel
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => updateStatusMutation.mutate({ propertyId: property.id, status: 'disponivel' })}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`action-available-${property.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {updateStatusMutation.isPending ? 'Atualizando...' : 'Marcar como Disponível'}
                              </DropdownMenuItem>
                              {property.type === 'Arrendar' && (
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ propertyId: property.id, status: 'arrendado' })}
                                  disabled={updateStatusMutation.isPending}
                                  data-testid={`action-rented-${property.id}`}
                                >
                                  <HandCoins className="h-4 w-4 mr-2" />
                                  {updateStatusMutation.isPending ? 'Atualizando...' : 'Marcar como Arrendado'}
                                </DropdownMenuItem>
                              )}
                              {property.type === 'Vender' && (
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ propertyId: property.id, status: 'vendido' })}
                                  disabled={updateStatusMutation.isPending}
                                  data-testid={`action-sold-${property.id}`}
                                >
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  {updateStatusMutation.isPending ? 'Atualizando...' : 'Marcar como Vendido'}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja eliminar este imóvel?")) {
                                    deletePropertyMutation.mutate(property.id);
                                  }
                                }}
                                disabled={deletePropertyMutation.isPending}
                                className="text-destructive focus:text-destructive"
                                data-testid={`action-delete-${property.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deletePropertyMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

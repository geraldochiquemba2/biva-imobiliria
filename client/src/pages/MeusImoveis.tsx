import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Property } from "@shared/schema";
import { 
  Building2, 
  ArrowLeft, 
  MapPin, 
  Plus,
  Home,
  Eye,
  Edit,
  MoreVertical,
  CheckCircle,
  XCircle,
  Trash2,
  Lock
} from "lucide-react";
import buildingImg from '@assets/stock_images/modern_apartment_bui_70397924.jpg';
import { RentalContractDialog } from "@/components/RentalContractDialog";
import PropertyImage from "@/components/PropertyImage";

interface PropertyWithEditInfo extends Property {
  hasActiveVisits?: boolean;
  isRented?: boolean;
  canEdit?: boolean;
  thumbnail?: string;
}

export default function MeusImoveis() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [rentalDialogProperty, setRentalDialogProperty] = useState<PropertyWithEditInfo | null>(null);

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery<PropertyWithEditInfo[]>({
    queryKey: ['/api/users', currentUser?.id, 'properties'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${currentUser?.id}/properties`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    enabled: !!currentUser?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest('PATCH', `/api/properties/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser?.id, 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Status atualizado!",
        description: "O status do imóvel foi atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/properties/${id}`);
      if (!res.ok) {
        throw new Error('Falha ao deletar imóvel');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser?.id, 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Imóvel eliminado!",
        description: "O imóvel foi eliminado com sucesso",
      });
      setDeletePropertyId(null);
    },
    onError: () => {
      toast({
        title: "Erro ao eliminar imóvel",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
      setDeletePropertyId(null);
    },
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

  const hasRole = (role: string) => currentUser?.userTypes?.includes(role) || false;
  
  const userProperties = properties;

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
              Meus Imóveis
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Gerencie seus imóveis cadastrados na plataforma
            </p>

            <Button asChild size="lg" data-testid="button-add-property">
              <Link href="/cadastrar-imovel">
                <Plus className="h-5 w-5 mr-2" />
                Cadastrar Novo Imóvel
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:-mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Button
            variant="ghost"
            asChild
            className="mb-6 md:text-white md:hover:text-white"
            data-testid="button-back"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
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
                  <div className="text-2xl font-bold text-green-600" data-testid="text-available-count">
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
                  <div className="text-2xl font-bold text-blue-600" data-testid="text-rented-count">
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
                  <div className="text-2xl font-bold text-purple-600" data-testid="text-sold-count">
                    {propertiesByStatus.vendido.length}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/imoveis-indisponiveis">
              <Card className="relative overflow-hidden hover-elevate active-elevate-2 cursor-pointer">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-10"
                  style={{ backgroundImage: `url(${buildingImg})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-transparent" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium">Indisponíveis</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-bold text-gray-600" data-testid="text-unavailable-count">
                    {propertiesByStatus.indisponivel.length}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {userProperties.length === 0 ? (
            <Card className="relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: `url(${buildingImg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <CardContent className="text-center py-16 relative z-10">
                <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-bold mb-2">
                  Nenhum imóvel cadastrado
                </h3>
                <p className="text-muted-foreground mb-6">
                  Comece cadastrando seu primeiro imóvel para arrendar ou vender
                </p>
                <Button asChild data-testid="button-add-first-property">
                  <Link href="/cadastrar-imovel">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Imóvel
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {['disponivel', 'arrendado', 'vendido', 'indisponivel'].map((status) => {
                const statusProperties = propertiesByStatus[status as keyof typeof propertiesByStatus];
                if (statusProperties.length === 0) return null;

                const statusLabels = {
                  disponivel: 'Disponíveis',
                  arrendado: 'Arrendados',
                  vendido: 'Vendidos',
                  indisponivel: 'Indisponíveis',
                };

                return (
                  <div key={status}>
                    <h2 className="text-2xl font-bold mb-4">{statusLabels[status as keyof typeof statusLabels]}</h2>
                    <div className="grid gap-4">
                      {statusProperties.map((property) => (
                        <Card key={property.id} className="hover-elevate overflow-hidden">
                          <div className="flex gap-4">
                            <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-md" data-testid={`img-property-${property.id}`}>
                              {property.images && property.images.length > 0 ? (
                                <PropertyImage
                                  src={property.images[0]}
                                  alt={property.title}
                                />
                              ) : (property as any).thumbnail ? (
                                <PropertyImage
                                  src={(property as any).thumbnail}
                                  alt={property.title}
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Home className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 flex flex-col min-w-0">
                              <CardHeader className="pb-3">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-xl mb-1" data-testid={`text-title-${property.id}`}>
                                      {property.title}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {property.bairro}, {property.municipio}
                                    </CardDescription>
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    <Badge data-testid={`badge-type-${property.id}`}>
                                      {property.type === 'Arrendar' ? 'Disponível para arrendar' : property.type === 'Vender' ? 'Disponível para compra' : property.type}
                                    </Badge>
                                    <Badge variant="outline" data-testid={`badge-category-${property.id}`}>
                                      {property.category}
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-muted-foreground">
                                    {property.bedrooms > 0 && (
                                      <div>{property.bedrooms} quartos</div>
                                    )}
                                    {property.bathrooms > 0 && (
                                      <div>{property.bathrooms} casas de banho</div>
                                    )}
                                    <div>{property.area}m²</div>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs text-muted-foreground">Preço</p>
                                      <p className="text-sm sm:text-lg font-bold truncate" data-testid={`text-price-${property.id}`}>
                                        {Number(property.price).toLocaleString('pt-AO', {
                                          style: 'currency',
                                          currency: 'AOA',
                                        })}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      {property.canEdit !== false ? (
                                        <Button variant="outline" size="icon" className="h-8 w-8" asChild data-testid={`button-edit-${property.id}`}>
                                          <Link href={`/editar-imovel/${property.id}`}>
                                            <Edit className="h-3 w-3" />
                                          </Link>
                                        </Button>
                                      ) : (
                                        <Button 
                                          variant="outline" 
                                          size="icon" 
                                          className="h-8 w-8" 
                                          disabled 
                                          data-testid={`button-edit-disabled-${property.id}`}
                                          title={property.hasActiveVisits ? "Imóvel tem visitas confirmadas" : "Imóvel está arrendado"}
                                        >
                                          <Lock className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Button variant="outline" size="icon" className="h-8 w-8" asChild data-testid={`button-view-${property.id}`}>
                                        <Link href={`/imoveis/${property.id}`}>
                                          <Eye className="h-3 w-3" />
                                        </Link>
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" size="icon" className="h-8 w-8" data-testid={`button-actions-${property.id}`}>
                                            <MoreVertical className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          {property.canEdit !== false ? (
                                            <DropdownMenuItem asChild data-testid={`action-edit-${property.id}`}>
                                              <Link href={`/editar-imovel/${property.id}`}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar Imóvel
                                              </Link>
                                            </DropdownMenuItem>
                                          ) : (
                                            <DropdownMenuItem disabled data-testid={`action-edit-disabled-${property.id}`}>
                                              <Lock className="h-4 w-4 mr-2" />
                                              Editar Imóvel
                                              <span className="text-xs text-muted-foreground ml-2">
                                                ({property.hasActiveVisits ? "Com visitas" : "Arrendado"})
                                              </span>
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuSeparator />
                                          {property.status !== 'disponivel' && (
                                            <DropdownMenuItem
                                              onClick={() => updateStatusMutation.mutate({ id: property.id, status: 'disponivel' })}
                                              disabled={updateStatusMutation.isPending || property.status === 'arrendado'}
                                              data-testid={`action-available-${property.id}`}
                                            >
                                              {property.status === 'arrendado' ? (
                                                <>
                                                  <Lock className="h-4 w-4 mr-2" />
                                                  Marcar como Disponível
                                                  <span className="text-xs text-muted-foreground ml-2">
                                                    (Arrendado)
                                                  </span>
                                                </>
                                              ) : (
                                                <>
                                                  <CheckCircle className="h-4 w-4 mr-2" />
                                                  {updateStatusMutation.isPending ? 'Atualizando...' : 'Marcar como Disponível'}
                                                </>
                                              )}
                                            </DropdownMenuItem>
                                          )}
                                          {property.status !== 'arrendado' && property.type === 'Arrendar' && (
                                            <DropdownMenuItem
                                              onClick={() => setRentalDialogProperty(property)}
                                              data-testid={`action-create-contract-${property.id}`}
                                            >
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              Criar Contrato de Arrendamento
                                            </DropdownMenuItem>
                                          )}
                                          {property.status !== 'vendido' && property.type === 'Vender' && (
                                            <DropdownMenuItem
                                              onClick={() => updateStatusMutation.mutate({ id: property.id, status: 'vendido' })}
                                              disabled={updateStatusMutation.isPending || property.status === 'arrendado'}
                                              data-testid={`action-sold-${property.id}`}
                                            >
                                              {property.status === 'arrendado' ? (
                                                <>
                                                  <Lock className="h-4 w-4 mr-2" />
                                                  Marcar como Vendido
                                                  <span className="text-xs text-muted-foreground ml-2">
                                                    (Arrendado)
                                                  </span>
                                                </>
                                              ) : (
                                                <>
                                                  <CheckCircle className="h-4 w-4 mr-2" />
                                                  {updateStatusMutation.isPending ? 'Atualizando...' : 'Marcar como Vendido'}
                                                </>
                                              )}
                                            </DropdownMenuItem>
                                          )}
                                          {property.status !== 'indisponivel' && (
                                            <DropdownMenuItem
                                              onClick={() => updateStatusMutation.mutate({ id: property.id, status: 'indisponivel' })}
                                              disabled={updateStatusMutation.isPending || property.canEdit === false || property.status === 'arrendado'}
                                              data-testid={`action-unavailable-${property.id}`}
                                            >
                                              {property.canEdit === false || property.status === 'arrendado' ? (
                                                <>
                                                  <Lock className="h-4 w-4 mr-2" />
                                                  Marcar como Indisponível
                                                  <span className="text-xs text-muted-foreground ml-2">
                                                    ({property.hasActiveVisits ? "Com visitas" : "Arrendado"})
                                                  </span>
                                                </>
                                              ) : (
                                                <>
                                                  <XCircle className="h-4 w-4 mr-2" />
                                                  {updateStatusMutation.isPending ? 'Atualizando...' : 'Marcar como Indisponível'}
                                                </>
                                              )}
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => setDeletePropertyId(property.id)}
                                            disabled={deletePropertyMutation.isPending || property.canEdit === false || property.status === 'arrendado'}
                                            className="text-destructive focus:text-destructive"
                                            data-testid={`action-delete-${property.id}`}
                                          >
                                            {property.canEdit === false || property.status === 'arrendado' ? (
                                              <>
                                                <Lock className="h-4 w-4 mr-2" />
                                                Eliminar
                                                <span className="text-xs text-muted-foreground ml-2">
                                                  ({property.hasActiveVisits ? "Com visitas" : "Arrendado"})
                                                </span>
                                              </>
                                            ) : (
                                              <>
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Eliminar
                                              </>
                                            )}
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {rentalDialogProperty && currentUser && (
        <RentalContractDialog
          open={!!rentalDialogProperty}
          onOpenChange={(open) => !open && setRentalDialogProperty(null)}
          property={rentalDialogProperty}
          currentUser={currentUser}
          onSuccess={() => {}}
        />
      )}

      <AlertDialog open={!!deletePropertyId} onOpenChange={(open) => !open && setDeletePropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja eliminar este imóvel?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O imóvel será permanentemente eliminado do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePropertyMutation.isPending} data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePropertyId && deletePropertyMutation.mutate(deletePropertyId)}
              disabled={deletePropertyMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deletePropertyMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

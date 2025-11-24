import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Calendar
} from "lucide-react";
import buildingImg from '@assets/stock_images/modern_apartment_bui_70397924.jpg';
import PropertyImage from "@/components/PropertyImage";

interface PropertyWithEditInfo extends Property {
  hasActiveVisits?: boolean;
  isRented?: boolean;
  canEdit?: boolean;
  thumbnail?: string;
}

export default function MeusImoveisTemporarios() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);

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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/properties'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'all' }),
      ]);
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/properties'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'all' }),
      ]);
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

  const shortTermProperties = properties.filter(
    p => p.approvalStatus === 'aprovado' && p.shortTerm === true
  );

  const propertiesByStatus = {
    disponivel: shortTermProperties.filter(p => p.status === 'disponivel'),
    arrendado: shortTermProperties.filter(p => p.status === 'arrendado'),
    indisponivel: shortTermProperties.filter(p => p.status === 'indisponivel'),
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      disponivel: { label: 'Disponível', variant: 'default' as const },
      arrendado: { label: 'Arrendado', variant: 'secondary' as const },
      indisponivel: { label: 'Indisponível', variant: 'outline' as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'default' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
              Meus Imóveis Temporários
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Gerencie seus imóveis de curta duração
            </p>

            <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20" data-testid="button-add-short-term-property">
              <Link to="/cadastrar-imovel-curta-duracao">
                <Plus className="h-5 w-5 mr-2" />
                Cadastrar Imóvel Temporário
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
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: `url(${buildingImg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Disponíveis</p>
                    <div className="text-3xl font-bold text-green-600" data-testid="text-available-count">
                      {propertiesByStatus.disponivel.length}
                    </div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: `url(${buildingImg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Arrendados</p>
                    <div className="text-3xl font-bold text-blue-600" data-testid="text-rented-count">
                      {propertiesByStatus.arrendado.length}
                    </div>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: `url(${buildingImg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-transparent" />
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Indisponíveis</p>
                    <div className="text-3xl font-bold text-gray-600" data-testid="text-unavailable-count">
                      {propertiesByStatus.indisponivel.length}
                    </div>
                  </div>
                  <XCircle className="h-8 w-8 text-gray-600/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {shortTermProperties.length === 0 ? (
            <Card className="relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: `url(${buildingImg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <CardContent className="text-center py-16 relative z-10">
                <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-bold mb-2">
                  Nenhum imóvel temporário cadastrado
                </h3>
                <p className="text-muted-foreground mb-6">
                  Comece cadastrando seu primeiro imóvel de curta duração
                </p>
                <Button asChild data-testid="button-add-first-property">
                  <Link to="/cadastrar-imovel-curta-duracao">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Imóvel Temporário
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shortTermProperties.map((property) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="overflow-hidden hover-elevate">
                    <div className="relative h-48">
                      <PropertyImage
                        src={property.thumbnail || ''}
                        alt={property.title}
                        className="w-full h-full"
                        variant="cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        {getStatusBadge(property.status)}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1" data-testid={`text-property-title-${property.id}`}>
                        {property.title}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="line-clamp-1">
                          {property.municipio}, {property.provincia}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between mb-4">
                        <div>
                          <span className="text-2xl font-bold text-primary" data-testid={`text-property-price-${property.id}`}>
                            {Number(property.price).toLocaleString('pt-AO')}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">Kz/noite</span>
                        </div>
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Temporário
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                          data-testid={`button-view-${property.id}`}
                        >
                          <Link to={`/imovel/${property.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                          disabled={property.canEdit === false}
                          data-testid={`button-edit-${property.id}`}
                        >
                          <Link to={`/editar-imovel/${property.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" data-testid={`button-more-${property.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {property.status === 'disponivel' && (
                              <DropdownMenuItem
                                onClick={() => updateStatusMutation.mutate({ id: property.id, status: 'indisponivel' })}
                                data-testid={`menu-mark-unavailable-${property.id}`}
                              >
                                Marcar Indisponível
                              </DropdownMenuItem>
                            )}
                            {property.status === 'indisponivel' && (
                              <DropdownMenuItem
                                onClick={() => updateStatusMutation.mutate({ id: property.id, status: 'disponivel' })}
                                data-testid={`menu-mark-available-${property.id}`}
                              >
                                Marcar Disponível
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletePropertyId(property.id)}
                              data-testid={`menu-delete-${property.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <AlertDialog open={!!deletePropertyId} onOpenChange={() => setDeletePropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Imóvel</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar este imóvel? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePropertyId && deletePropertyMutation.mutate(deletePropertyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

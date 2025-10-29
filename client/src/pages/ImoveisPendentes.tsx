import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import PropertyImage from "@/components/PropertyImage";
import { formatAOA } from "@/lib/currency";

interface PropertyWithEditInfo extends Property {
  hasActiveVisits?: boolean;
  isRented?: boolean;
  canEdit?: boolean;
  thumbnail?: string;
}

export default function ImoveisPendentes() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rejectionDialogProperty, setRejectionDialogProperty] = useState<PropertyWithEditInfo | null>(null);
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

  const acknowledgeRejectionMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const res = await apiRequest('POST', `/api/properties/${propertyId}/acknowledge-rejection`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser?.id, 'properties'] });
      toast({
        title: "Reconhecido!",
        description: "Você reconheceu a mensagem de rejeição. Pode agora editar o imóvel.",
      });
      setRejectionDialogProperty(null);
    },
    onError: () => {
      toast({
        title: "Erro ao reconhecer",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const res = await apiRequest('DELETE', `/api/properties/${propertyId}`, {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Falha ao eliminar imóvel');
      }
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser?.id, 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Pedido eliminado!",
        description: "O pedido de imóvel foi eliminado com sucesso.",
      });
      setDeletePropertyId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (userLoading || propertiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge data-testid={`badge-status-aprovado`} className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'recusado':
        return <Badge data-testid={`badge-status-recusado`} variant="destructive"><XCircle className="w-3 h-3 mr-1" />Recusado</Badge>;
      default:
        return <Badge data-testid={`badge-status-pendente`} variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Button
            data-testid="button-back"
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold mb-2">Meus Imóveis</h1>
          <p className="text-muted-foreground">
            Acompanhe o status de aprovação dos seus imóveis
          </p>
        </div>

        {properties.length === 0 ? (
          <Card data-testid="card-no-properties">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">Você ainda não cadastrou nenhum imóvel</p>
              <Button data-testid="button-add-property" onClick={() => setLocation('/cadastrar-imovel')}>
                Cadastrar Primeiro Imóvel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card data-testid={`card-property-${property.id}`} className="hover-elevate overflow-hidden h-full flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <PropertyImage
                      src={property.thumbnail || ''}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      {getApprovalStatusBadge(property.approvalStatus || 'pendente')}
                    </div>
                  </div>

                  <CardHeader className="gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-1" data-testid={`text-title-${property.id}`}>
                          {property.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="line-clamp-1">{property.bairro}, {property.municipio}</span>
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <Badge data-testid={`badge-type-${property.id}`} variant="outline">{property.type}</Badge>
                      <Badge data-testid={`badge-category-${property.id}`} variant="outline">{property.category}</Badge>
                    </div>

                    <p className="text-2xl font-bold text-primary mt-2" data-testid={`text-price-${property.id}`}>
                      {formatAOA(Number(property.price))}
                    </p>

                    {property.approvalStatus === 'recusado' && property.rejectionMessage && !property.rejectionAcknowledged && (
                      <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-destructive">Imóvel recusado</p>
                            <p className="text-xs text-muted-foreground mt-1">Clique em "Ver Mensagem" para detalhes</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="mt-auto pt-0">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        data-testid={`button-view-${property.id}`}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setLocation(`/imoveis/${property.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>

                      {property.approvalStatus === 'recusado' && property.rejectionMessage && !property.rejectionAcknowledged ? (
                        <Button
                          data-testid={`button-rejection-${property.id}`}
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => setRejectionDialogProperty(property)}
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Ver Mensagem
                        </Button>
                      ) : property.approvalStatus === 'aprovado' || property.rejectionAcknowledged ? (
                        <Button
                          data-testid={`button-edit-${property.id}`}
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => setLocation(`/editar-imovel/${property.id}`)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      ) : null}

                      {property.approvalStatus === 'pendente' && (
                        <Button
                          data-testid={`button-delete-${property.id}`}
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletePropertyId(property.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Message Dialog */}
      <AlertDialog open={!!rejectionDialogProperty} onOpenChange={(open) => !open && setRejectionDialogProperty(null)}>
        <AlertDialogContent data-testid="dialog-rejection">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Imóvel Recusado
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="space-y-4 mt-4">
                <div>
                  <p className="font-medium text-foreground mb-2">Mensagem do Administrador:</p>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-foreground whitespace-pre-wrap" data-testid="text-rejection-message">
                      {rejectionDialogProperty?.rejectionMessage}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-foreground">
                    <strong>O que fazer agora?</strong><br />
                    Após reconhecer esta mensagem, você poderá editar o imóvel e fazer as correções sugeridas pelo administrador.
                    Quando terminar, o imóvel voltará para análise.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-rejection">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-acknowledge-rejection"
              onClick={() => rejectionDialogProperty && acknowledgeRejectionMutation.mutate(rejectionDialogProperty.id)}
              disabled={acknowledgeRejectionMutation.isPending}
            >
              {acknowledgeRejectionMutation.isPending ? 'Reconhecendo...' : 'OK, Entendi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Property Confirmation Dialog */}
      <AlertDialog open={!!deletePropertyId} onOpenChange={(open) => !open && setDeletePropertyId(null)}>
        <AlertDialogContent data-testid="dialog-delete-property">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Eliminar Pedido de Imóvel
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="space-y-3 mt-2">
                <p className="text-foreground">
                  Tem certeza que deseja eliminar este pedido de imóvel?
                </p>
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-foreground">
                    <strong>Atenção:</strong> Esta ação não pode ser desfeita. O imóvel será permanentemente removido do sistema.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() => deletePropertyId && deletePropertyMutation.mutate(deletePropertyId)}
              disabled={deletePropertyMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePropertyMutation.isPending ? 'Eliminando...' : 'Sim, Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

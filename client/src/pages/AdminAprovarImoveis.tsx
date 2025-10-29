import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Eye
} from "lucide-react";
import PropertyImage from "@/components/PropertyImage";
import { formatAOA } from "@/lib/currency";

export default function AdminAprovarImoveis() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [approvePropertyId, setApprovePropertyId] = useState<string | null>(null);
  const [rejectPropertyId, setRejectPropertyId] = useState<string | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const { data: pendingProperties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties/pending'],
    queryFn: async () => {
      const response = await fetch(`/api/properties/pending`);
      if (!response.ok) throw new Error('Failed to fetch pending properties');
      return response.json();
    },
    enabled: !!currentUser?.userTypes?.includes('admin'),
  });

  useEffect(() => {
    if (!userLoading && !currentUser) {
      setLocation('/login');
    } else if (currentUser && !currentUser.userTypes?.includes('admin')) {
      setLocation('/dashboard');
    }
  }, [currentUser, userLoading, setLocation]);

  const approveMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const res = await apiRequest('POST', `/api/properties/${propertyId}/approve`, {});
      return await res.json();
    },
    onMutate: async (propertyId) => {
      await queryClient.cancelQueries({ queryKey: ['/api/properties/pending'] });
      
      const previousProperties = queryClient.getQueryData<Property[]>(['/api/properties/pending']);
      
      queryClient.setQueryData<Property[]>(
        ['/api/properties/pending'],
        (old = []) => old.filter(p => p.id !== propertyId)
      );
      
      return { previousProperties };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/properties'],
        refetchType: 'all'
      });
      toast({
        title: "Imóvel aprovado!",
        description: "O imóvel foi aprovado e agora está publicado.",
      });
      setApprovePropertyId(null);
    },
    onError: (_error, _propertyId, context) => {
      if (context?.previousProperties) {
        queryClient.setQueryData(['/api/properties/pending'], context.previousProperties);
      }
      toast({
        title: "Erro ao aprovar",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/pending'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ propertyId, message }: { propertyId: string; message: string }) => {
      const res = await apiRequest('POST', `/api/properties/${propertyId}/reject`, { message });
      return await res.json();
    },
    onMutate: async ({ propertyId }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/properties/pending'] });
      
      const previousProperties = queryClient.getQueryData<Property[]>(['/api/properties/pending']);
      
      queryClient.setQueryData<Property[]>(
        ['/api/properties/pending'],
        (old = []) => old.filter(p => p.id !== propertyId)
      );
      
      return { previousProperties };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/properties'],
        refetchType: 'all'
      });
      toast({
        title: "Imóvel recusado",
        description: "O proprietário foi notificado e pode fazer as correções.",
      });
      setRejectPropertyId(null);
      setRejectionMessage("");
    },
    onError: (_error, _vars, context) => {
      if (context?.previousProperties) {
        queryClient.setQueryData(['/api/properties/pending'], context.previousProperties);
      }
      toast({
        title: "Erro ao recusar",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/pending'] });
    },
  });

  if (userLoading || propertiesLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser || !currentUser.userTypes?.includes('admin')) {
    return null;
  }

  const propertyToApprove = pendingProperties.find(p => p.id === approvePropertyId);
  const propertyToReject = pendingProperties.find(p => p.id === rejectPropertyId);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <Button
              data-testid="button-back"
              variant="ghost"
              onClick={() => setLocation('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
              Aprovar Imóveis
            </h1>
            <p className="text-muted-foreground">
              Revise e aprove ou recuse imóveis pendentes de aprovação
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Imóveis Pendentes
              </CardTitle>
              <CardDescription>
                {pendingProperties.length} {pendingProperties.length === 1 ? 'imóvel aguardando' : 'imóveis aguardando'} aprovação
              </CardDescription>
            </CardHeader>
          </Card>

          {pendingProperties.length === 0 ? (
            <Card data-testid="card-no-pending">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <p className="text-muted-foreground">Não há imóveis pendentes de aprovação</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card data-testid={`card-property-${property.id}`} className="hover-elevate overflow-hidden h-full flex flex-col">
                    <div className="relative h-48 overflow-hidden">
                      <PropertyImage
                        src={(property as any).thumbnail || ''}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge data-testid={`badge-pending-${property.id}`} variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendente
                        </Badge>
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

                      {property.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {property.description}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="mt-auto pt-0">
                      <div className="flex flex-col gap-2">
                        <Button
                          data-testid={`button-view-${property.id}`}
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/imoveis/${property.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>

                        <div className="flex gap-2">
                          <Button
                            data-testid={`button-approve-${property.id}`}
                            variant="default"
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => setApprovePropertyId(property.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            data-testid={`button-reject-${property.id}`}
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => setRejectPropertyId(property.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Recusar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={!!approvePropertyId} onOpenChange={(open) => !open && setApprovePropertyId(null)}>
        <AlertDialogContent data-testid="dialog-approve">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Aprovar Imóvel
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <p className="mb-3">Tem certeza que deseja aprovar este imóvel?</p>
              {propertyToApprove && (
                <div className="p-4 bg-muted rounded-md">
                  <p className="font-medium text-foreground">{propertyToApprove.title}</p>
                  <p className="text-sm mt-1">{propertyToApprove.bairro}, {propertyToApprove.municipio}</p>
                  <p className="text-sm mt-1 font-bold text-primary">{formatAOA(Number(propertyToApprove.price))}</p>
                </div>
              )}
              <p className="mt-3 text-sm">O imóvel será publicado e ficará visível para todos os usuários.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-approve">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-approve"
              onClick={() => approvePropertyId && approveMutation.mutate(approvePropertyId)}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? 'Aprovando...' : 'Confirmar Aprovação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectPropertyId} onOpenChange={(open) => {
        if (!open) {
          setRejectPropertyId(null);
          setRejectionMessage("");
        }
      }}>
        <DialogContent data-testid="dialog-reject">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Recusar Imóvel
            </DialogTitle>
            <DialogDescription>
              Por favor, forneça uma mensagem explicando o motivo da recusa. Esta mensagem será enviada ao proprietário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {propertyToReject && (
              <div className="p-4 bg-muted rounded-md">
                <p className="font-medium text-foreground">{propertyToReject.title}</p>
                <p className="text-sm mt-1">{propertyToReject.bairro}, {propertyToReject.municipio}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Mensagem de Rejeição *</label>
              <Textarea
                data-testid="textarea-rejection-message"
                placeholder="Ex: As imagens estão de baixa qualidade. Por favor, adicione fotos mais nítidas do imóvel."
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Seja claro e específico sobre as mudanças necessárias.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              data-testid="button-cancel-reject"
              variant="outline"
              onClick={() => {
                setRejectPropertyId(null);
                setRejectionMessage("");
              }}
            >
              Cancelar
            </Button>
            <Button
              data-testid="button-confirm-reject"
              variant="destructive"
              onClick={() => {
                if (rejectPropertyId && rejectionMessage.trim()) {
                  rejectMutation.mutate({ propertyId: rejectPropertyId, message: rejectionMessage });
                }
              }}
              disabled={!rejectionMessage.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Recusando...' : 'Confirmar Recusa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

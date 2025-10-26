import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Calendar, Clock, MapPin, User, ArrowLeft, XCircle, Check, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { User as UserType } from "@shared/schema";
import emptyStateImage from "@assets/stock_images/empty_calendar_sched_60cbbdfd.jpg";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  property?: {
    title: string;
    bairro: string;
    municipio: string;
    provincia: string;
    images?: string[];
    ownerId: string;
  };
  cliente?: {
    fullName: string;
    phone: string;
  };
}

export default function VisitasAgendadas() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showProposeDialog, setShowProposeDialog] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [ownerMessage, setOwnerMessage] = useState("");
  
  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/auth/me'],
  });

  const { data: visits, isLoading } = useQuery<Visit[]>({
    queryKey: ['/api/visits'],
    enabled: !!currentUser,
  });

  const cancelVisitMutation = useMutation({
    mutationFn: async (visitId: string) => {
      const res = await apiRequest('PATCH', `/api/visits/${visitId}`, {
        status: 'cancelada',
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visits'] });
      toast({
        title: "Visita cancelada",
        description: "A visita foi cancelada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao cancelar visita",
        description: "Não foi possível cancelar a visita. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const clientResponseMutation = useMutation({
    mutationFn: async ({ visitId, action }: { visitId: string; action: 'accept' | 'reject' }) => {
      const res = await apiRequest('POST', `/api/visits/${visitId}/client-response`, { action });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visits'] });
      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi enviada ao proprietário",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao enviar resposta",
        description: "Não foi possível enviar sua resposta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const ownerResponseMutation = useMutation({
    mutationFn: async ({ visitId, action, proposedDateTime, message }: { 
      visitId: string; 
      action: 'accept' | 'reject' | 'propose'; 
      proposedDateTime?: string;
      message?: string;
    }) => {
      const res = await apiRequest('POST', `/api/visits/${visitId}/owner-response`, { 
        action, 
        proposedDateTime,
        message 
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visits'] });
      setShowProposeDialog(false);
      setProposedDate("");
      setProposedTime("");
      setOwnerMessage("");
      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi enviada ao cliente",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao enviar resposta",
        description: "Não foi possível enviar sua resposta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const pendingVisits = visits?.filter(v => 
    v.status === 'pendente_proprietario' || v.status === 'pendente_cliente'
  ) || [];
  
  const scheduledVisits = visits?.filter(v => v.status === 'agendada') || [];
  const completedVisits = visits?.filter(v => v.status === 'concluida' || v.status === 'cancelada') || [];
  
  const handleGoBack = () => {
    window.history.length > 1 ? window.history.back() : setLocation('/');
  };

  const handleCancelVisit = (visitId: string) => {
    cancelVisitMutation.mutate(visitId);
  };

  const handleClientResponse = (visitId: string, action: 'accept' | 'reject') => {
    clientResponseMutation.mutate({ visitId, action });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'pendente_proprietario': { label: 'Aguardando Proprietário', variant: 'outline' },
      'pendente_cliente': { label: 'Aguardando Resposta', variant: 'default' },
      'agendada': { label: 'Confirmada', variant: 'default' },
      'concluida': { label: 'Concluída', variant: 'secondary' },
      'cancelada': { label: 'Cancelada', variant: 'destructive' },
    };
    return statusMap[status] || { label: status, variant: 'outline' as const };
  };

  const getDisplayDateTime = (visit: Visit) => {
    if (visit.scheduledDateTime) return new Date(visit.scheduledDateTime);
    if (visit.ownerProposedDateTime) return new Date(visit.ownerProposedDateTime);
    return new Date(visit.requestedDateTime);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGoBack}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold">Visitas Agendadas</h1>
              </div>
            </div>
            <p className="text-muted-foreground">
              Acompanhe suas visitas programadas aos imóveis
            </p>
          </div>

          {pendingVisits.length === 0 && scheduledVisits.length === 0 ? (
            <Card className="overflow-hidden">
              <div 
                className="relative bg-cover bg-center"
                style={{ backgroundImage: `url(${emptyStateImage})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
                <CardContent className="relative flex flex-col items-center justify-center py-16 text-white">
                  <Calendar className="h-16 w-16 mb-4 opacity-90" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma visita agendada</h3>
                  <p className="text-white/90 text-center max-w-md">
                    Você ainda não possui visitas agendadas. Quando você agendar uma visita a um imóvel, ela aparecerá aqui.
                  </p>
                </CardContent>
              </div>
            </Card>
          ) : (
            <div className="space-y-8">
              {pendingVisits.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Aguardando Confirmação</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pendingVisits.map((visit) => (
                      <motion.div
                        key={visit.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Card className="hover-elevate">
                          <CardHeader>
                            <div className="flex gap-4">
                              {visit.property?.images && visit.property.images.length > 0 && (
                                <div className="w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                  <img
                                    src={visit.property.images[0]}
                                    alt={visit.property.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                                      <CardTitle className="text-base truncate" data-testid={`text-property-title-${visit.id}`}>
                                        {visit.property?.title || 'Imóvel'}
                                      </CardTitle>
                                    </div>
                                    <CardDescription className="flex items-start gap-1 text-sm">
                                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      <span className="line-clamp-2">
                                        {visit.property?.bairro}, {visit.property?.municipio}
                                        {visit.property?.provincia && `, ${visit.property.provincia}`}
                                      </span>
                                    </CardDescription>
                                  </div>
                                  <Badge 
                                    variant={getStatusBadge(visit.status).variant}
                                    data-testid={`badge-status-${visit.id}`}
                                    className="flex-shrink-0"
                                  >
                                    {getStatusBadge(visit.status).label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {visit.status === 'pendente_cliente' && visit.ownerProposedDateTime && (
                                <div className="bg-muted/50 p-3 rounded-md space-y-2">
                                  <p className="text-sm font-medium">O proprietário propôs uma nova data:</p>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-primary">
                                      {format(new Date(visit.ownerProposedDateTime), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                  </div>
                                  {visit.ownerMessage && (
                                    <p className="text-sm text-muted-foreground italic">"{visit.ownerMessage}"</p>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {visit.status === 'pendente_proprietario' ? 'Data solicitada:' : 'Data:'}
                                </span>
                                <span className="text-muted-foreground" data-testid={`text-date-${visit.id}`}>
                                  {format(getDisplayDateTime(visit), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t space-y-2">
                              {visit.status === 'pendente_cliente' ? (
                                <div className="flex gap-2">
                                  <Button
                                    className="flex-1"
                                    onClick={() => handleClientResponse(visit.id, 'accept')}
                                    disabled={clientResponseMutation.isPending}
                                    data-testid={`button-accept-${visit.id}`}
                                  >
                                    {clientResponseMutation.isPending ? 'Processando...' : 'Aceitar Proposta'}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleClientResponse(visit.id, 'reject')}
                                    disabled={clientResponseMutation.isPending}
                                    data-testid={`button-reject-${visit.id}`}
                                  >
                                    {clientResponseMutation.isPending ? 'Processando...' : 'Recusar'}
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="destructive"
                                  className="w-full"
                                  onClick={() => handleCancelVisit(visit.id)}
                                  disabled={cancelVisitMutation.isPending}
                                  data-testid={`button-cancel-${visit.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {cancelVisitMutation.isPending ? 'Cancelando...' : 'Cancelar Solicitação'}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                className="w-full"
                                asChild
                                data-testid={`button-view-property-${visit.id}`}
                              >
                                <Link href={`/imoveis/${visit.propertyId}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Imóvel
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {scheduledVisits.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Visitas Confirmadas</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {scheduledVisits.map((visit) => (
                <motion.div
                  key={visit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="hover-elevate">
                    <CardHeader>
                      <div className="flex gap-4">
                        {visit.property?.images && visit.property.images.length > 0 && (
                          <div className="w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={visit.property.images[0]}
                              alt={visit.property.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                                <CardTitle className="text-base truncate" data-testid={`text-property-title-${visit.id}`}>
                                  {visit.property?.title || 'Imóvel'}
                                </CardTitle>
                              </div>
                              <CardDescription className="flex items-start gap-1 text-sm">
                                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">
                                  {visit.property?.bairro}, {visit.property?.municipio}
                                  {visit.property?.provincia && `, ${visit.property.provincia}`}
                                </span>
                              </CardDescription>
                            </div>
                            <Badge 
                              variant={getStatusBadge(visit.status).variant}
                              data-testid={`badge-status-${visit.id}`}
                              className="flex-shrink-0"
                            >
                              {getStatusBadge(visit.status).label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {visit.status === 'pendente_cliente' && visit.ownerProposedDateTime && (
                          <div className="bg-muted/50 p-3 rounded-md space-y-2">
                            <p className="text-sm font-medium">O proprietário propôs uma nova data:</p>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="font-medium text-primary">
                                {format(new Date(visit.ownerProposedDateTime), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            {visit.ownerMessage && (
                              <p className="text-sm text-muted-foreground italic">"{visit.ownerMessage}"</p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {visit.status === 'agendada' ? 'Data confirmada:' : 
                             visit.status === 'pendente_proprietario' ? 'Data solicitada:' : 'Data:'}
                          </span>
                          <span className="text-muted-foreground" data-testid={`text-date-${visit.id}`}>
                            {format(getDisplayDateTime(visit), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>

                        {!currentUser?.userTypes?.includes('cliente') && visit.cliente && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Cliente:</span>
                            <span className="text-muted-foreground">
                              {visit.cliente.fullName}
                            </span>
                          </div>
                        )}
                      </div>

                      {visit.observacoes && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-1">Observações:</p>
                          <p className="text-sm text-muted-foreground">{visit.observacoes}</p>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t space-y-2">
                        {visit.status === 'pendente_cliente' ? (
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={() => handleClientResponse(visit.id, 'accept')}
                              disabled={clientResponseMutation.isPending}
                              data-testid={`button-accept-${visit.id}`}
                            >
                              {clientResponseMutation.isPending ? 'Processando...' : 'Aceitar Proposta'}
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleClientResponse(visit.id, 'reject')}
                              disabled={clientResponseMutation.isPending}
                              data-testid={`button-reject-${visit.id}`}
                            >
                              {clientResponseMutation.isPending ? 'Processando...' : 'Recusar'}
                            </Button>
                          </div>
                        ) : visit.status === 'agendada' || visit.status === 'pendente_proprietario' ? (
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleCancelVisit(visit.id)}
                            disabled={cancelVisitMutation.isPending}
                            data-testid={`button-cancel-${visit.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {cancelVisitMutation.isPending ? 'Cancelando...' : 'Cancelar Visita'}
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          className="w-full"
                          asChild
                          data-testid={`button-view-property-${visit.id}`}
                        >
                          <Link href={`/imoveis/${visit.propertyId}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Imóvel
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

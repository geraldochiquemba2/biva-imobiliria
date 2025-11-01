import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Calendar, Clock, MapPin, User, ArrowLeft, XCircle, Check, X, Eye, Mail, Phone, ChevronLeft, ChevronRight } from "lucide-react";
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
    owner?: {
      fullName: string;
      email: string;
      phone: string;
    };
  };
  cliente?: {
    fullName: string;
    phone: string;
  };
}

interface PaginatedVisits {
  data: Visit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function VisitasAgendadas() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showProposeDialog, setShowProposeDialog] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [ownerMessage, setOwnerMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  
  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/auth/me'],
  });

  const { data: paginatedVisits, isLoading } = useQuery<PaginatedVisits>({
    queryKey: ['/api/visits', { page: currentPage, limit }],
    queryFn: async () => {
      const res = await fetch(`/api/visits?page=${currentPage}&limit=${limit}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch visits');
      return res.json();
    },
    enabled: !!currentUser,
  });

  const visits = paginatedVisits?.data || [];

  useEffect(() => {
    if (visits) {
      console.log('Visitas recebidas:', visits);
      if (visits.length > 0) {
        console.log('Primeira visita:', visits[0]);
        console.log('Property da primeira visita:', visits[0].property);
      }
    }
  }, [visits]);

  const cancelVisitMutation = useMutation({
    mutationFn: async (visitId: string) => {
      const res = await apiRequest('PATCH', `/api/visits/${visitId}`, {
        status: 'cancelada',
      });
      return await res.json();
    },
    onMutate: async (visitId) => {
      const queryKey = ['/api/visits', { page: currentPage, limit }];
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData<PaginatedVisits>(queryKey);
      
      if (previousData) {
        queryClient.setQueryData<PaginatedVisits>(
          queryKey,
          {
            ...previousData,
            data: previousData.data.map(v => v.id === visitId ? { ...v, status: 'cancelada' } : v)
          }
        );
      }
      
      return { previousData };
    },
    onSuccess: () => {
      toast({
        title: "Visita cancelada",
        description: "A visita foi cancelada com sucesso",
      });
    },
    onError: (_error, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/visits', { page: currentPage, limit }], context.previousData);
      }
      toast({
        title: "Erro ao cancelar visita",
        description: "Não foi possível cancelar a visita. Tente novamente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Invalidate all visit queries (all pages)
      queryClient.invalidateQueries({ 
        queryKey: ['/api/visits'],
        exact: false,
      });
    },
  });

  const clientResponseMutation = useMutation({
    mutationFn: async ({ visitId, action }: { visitId: string; action: 'accept' | 'reject' }) => {
      const res = await apiRequest('POST', `/api/visits/${visitId}/client-response`, { action });
      return await res.json();
    },
    onMutate: async ({ visitId, action }) => {
      const queryKey = ['/api/visits', { page: currentPage, limit }];
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData<PaginatedVisits>(queryKey);
      
      if (previousData) {
        queryClient.setQueryData<PaginatedVisits>(
          queryKey,
          {
            ...previousData,
            data: previousData.data.map(v => {
              if (v.id === visitId) {
                if (action === 'accept') {
                  return { ...v, status: 'agendada', scheduledDateTime: v.ownerProposedDateTime };
                } else {
                  return { ...v, status: 'cancelada' };
                }
              }
              return v;
            })
          }
        );
      }
      
      return { previousData };
    },
    onSuccess: () => {
      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi enviada ao proprietário",
      });
    },
    onError: (_error, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/visits', { page: currentPage, limit }], context.previousData);
      }
      toast({
        title: "Erro ao enviar resposta",
        description: "Não foi possível enviar sua resposta. Tente novamente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Invalidate all visit queries (all pages)
      queryClient.invalidateQueries({ 
        queryKey: ['/api/visits'],
        exact: false,
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
    onMutate: async ({ visitId, action, proposedDateTime, message }) => {
      const queryKey = ['/api/visits', { page: currentPage, limit }];
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData<PaginatedVisits>(queryKey);
      
      if (previousData) {
        queryClient.setQueryData<PaginatedVisits>(
          queryKey,
          {
            ...previousData,
            data: previousData.data.map(v => {
              if (v.id === visitId) {
                if (action === 'accept') {
                  return { ...v, status: 'agendada', scheduledDateTime: v.requestedDateTime };
                } else if (action === 'reject') {
                  return { ...v, status: 'cancelada' };
                } else if (action === 'propose') {
                  return { ...v, status: 'pendente_cliente', ownerProposedDateTime: proposedDateTime, ownerMessage: message };
                }
              }
              return v;
            })
          }
        );
      }
      
      return { previousData };
    },
    onSuccess: () => {
      setShowProposeDialog(false);
      setProposedDate("");
      setProposedTime("");
      setOwnerMessage("");
      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi enviada ao cliente",
      });
    },
    onError: (_error, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/visits', { page: currentPage, limit }], context.previousData);
      }
      toast({
        title: "Erro ao enviar resposta",
        description: "Não foi possível enviar sua resposta. Tente novamente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Invalidate all visit queries (all pages)
      queryClient.invalidateQueries({ 
        queryKey: ['/api/visits'],
        exact: false,
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

  const handleOwnerAccept = (visitId: string) => {
    ownerResponseMutation.mutate({ visitId, action: 'accept' });
  };

  const handleOwnerReject = (visitId: string) => {
    ownerResponseMutation.mutate({ visitId, action: 'reject' });
  };

  const handleOpenProposeDialog = (visitId: string) => {
    setProposedDate("");
    setProposedTime("");
    setOwnerMessage("");
    setSelectedVisitId(visitId);
    setShowProposeDialog(true);
  };

  const handleCloseProposeDialog = () => {
    setShowProposeDialog(false);
    setProposedDate("");
    setProposedTime("");
    setOwnerMessage("");
    setSelectedVisitId(null);
  };

  const handleProposeDate = () => {
    if (!selectedVisitId || !proposedDate || !proposedTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha a data e hora propostas",
        variant: "destructive",
      });
      return;
    }

    const proposedDateTime = new Date(`${proposedDate}T${proposedTime}:00`);
    const now = new Date();
    
    if (proposedDateTime <= now) {
      toast({
        title: "Data inválida",
        description: "A data e hora propostas devem ser no futuro",
        variant: "destructive",
      });
      return;
    }

    ownerResponseMutation.mutate({ 
      visitId: selectedVisitId, 
      action: 'propose', 
      proposedDateTime: proposedDateTime.toISOString(),
      message: ownerMessage || undefined
    });
  };

  const isOwner = (visit: Visit) => {
    return currentUser && visit.property?.ownerId === currentUser.id;
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
                          <CardHeader className="p-4">
                            <div className="flex gap-3">
                              {visit.property?.images && visit.property.images.length > 0 && (
                                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                  <img
                                    src={visit.property.images[0]}
                                    alt={visit.property.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 mb-1">
                                      <Building2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                      <CardTitle className="text-base line-clamp-2" data-testid={`text-property-title-${visit.id}`}>
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
                          <CardContent className="p-4 pt-0">
                            <div className="space-y-2">
                              {visit.status === 'pendente_cliente' && visit.ownerProposedDateTime && (
                                <div className="bg-muted/50 p-2 rounded-md space-y-1.5">
                                  <p className="text-xs font-medium">O proprietário propôs uma nova data:</p>
                                  <div className="flex items-center gap-2 text-xs">
                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                    <span className="font-medium text-primary">
                                      {format(new Date(visit.ownerProposedDateTime), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                  </div>
                                  {visit.ownerMessage && (
                                    <p className="text-xs text-muted-foreground italic">"{visit.ownerMessage}"</p>
                                  )}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium">
                                  {visit.status === 'pendente_proprietario' ? 'Data solicitada:' : 'Data:'}
                                </span>
                                <span className="text-muted-foreground" data-testid={`text-date-${visit.id}`}>
                                  {format(getDisplayDateTime(visit), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>

                              {visit.status === 'pendente_proprietario' && isOwner(visit) && visit.cliente && (
                                <div className="bg-primary/5 p-2 rounded-md space-y-2">
                                  <p className="text-xs font-medium">Solicitante:</p>
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                      <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                      <span className="font-medium">Nome:</span>
                                      <span className="text-muted-foreground" data-testid={`text-client-name-pending-${visit.id}`}>
                                        {visit.cliente.fullName}
                                      </span>
                                    </div>
                                    {visit.cliente.phone && (
                                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                        <span className="text-muted-foreground" data-testid={`text-client-phone-pending-${visit.id}`}>
                                          {visit.cliente.phone}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {visit.cliente.phone && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                      asChild
                                      data-testid={`button-call-client-pending-${visit.id}`}
                                    >
                                      <a href={`tel:${visit.cliente.phone}`}>
                                        <Phone className="h-3.5 w-3.5 mr-2" />
                                        Ligar para o Solicitante
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 pt-3 border-t space-y-2">
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
                              ) : visit.status === 'pendente_proprietario' && isOwner(visit) ? (
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <Button
                                      className="flex-1"
                                      onClick={() => handleOwnerAccept(visit.id)}
                                      disabled={ownerResponseMutation.isPending}
                                      data-testid={`button-owner-accept-${visit.id}`}
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      {ownerResponseMutation.isPending ? 'Processando...' : 'Aceitar'}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      className="flex-1"
                                      onClick={() => handleOwnerReject(visit.id)}
                                      disabled={ownerResponseMutation.isPending}
                                      data-testid={`button-owner-reject-${visit.id}`}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      {ownerResponseMutation.isPending ? 'Processando...' : 'Recusar'}
                                    </Button>
                                  </div>
                                  <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleOpenProposeDialog(visit.id)}
                                    disabled={ownerResponseMutation.isPending}
                                    data-testid={`button-propose-date-${visit.id}`}
                                  >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Propor Outra Data
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
                    <CardHeader className="p-4">
                      <div className="flex gap-3">
                        {visit.property?.images && visit.property.images.length > 0 && (
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={visit.property.images[0]}
                              alt={visit.property.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <CardTitle className="text-base line-clamp-2" data-testid={`text-property-title-${visit.id}`}>
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
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-2">
                        {visit.status === 'pendente_cliente' && visit.ownerProposedDateTime && (
                          <div className="bg-muted/50 p-2 rounded-md space-y-1.5">
                            <p className="text-xs font-medium">O proprietário propôs uma nova data:</p>
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              <span className="font-medium text-primary">
                                {format(new Date(visit.ownerProposedDateTime), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            {visit.ownerMessage && (
                              <p className="text-xs text-muted-foreground italic">"{visit.ownerMessage}"</p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium">
                            {visit.status === 'agendada' ? 'Data confirmada:' : 
                             visit.status === 'pendente_proprietario' ? 'Data solicitada:' : 'Data:'}
                          </span>
                          <span className="text-muted-foreground" data-testid={`text-date-${visit.id}`}>
                            {format(getDisplayDateTime(visit), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>

                        {!currentUser?.userTypes?.includes('cliente') && visit.status !== 'agendada' && visit.cliente && (
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">Cliente:</span>
                            <span className="text-muted-foreground">
                              {visit.cliente.fullName}
                            </span>
                          </div>
                        )}

                        {visit.status === 'agendada' && !isOwner(visit) && visit.property?.owner && (
                          <div className="bg-primary/5 p-2 rounded-md space-y-2">
                            <p className="text-xs font-medium">Contato do Proprietário:</p>
                            <div className="space-y-1">
                              {visit.property.owner.email && (
                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                  <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <span className="text-muted-foreground truncate" data-testid={`text-owner-email-${visit.id}`}>
                                    {visit.property.owner.email}
                                  </span>
                                </div>
                              )}
                              {visit.property.owner.phone && (
                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                  <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <span className="text-muted-foreground" data-testid={`text-owner-phone-${visit.id}`}>
                                    {visit.property.owner.phone}
                                  </span>
                                </div>
                              )}
                            </div>
                            {visit.property.owner.phone && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                asChild
                                data-testid={`button-call-owner-${visit.id}`}
                              >
                                <a href={`tel:${visit.property.owner.phone}`}>
                                  <Phone className="h-3.5 w-3.5 mr-2" />
                                  Ligar para o Proprietário
                                </a>
                              </Button>
                            )}
                          </div>
                        )}

                        {visit.status === 'agendada' && isOwner(visit) && visit.cliente && (
                          <div className="bg-primary/5 p-2 rounded-md space-y-2">
                            <p className="text-xs font-medium">Contato do Cliente:</p>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium">Nome:</span>
                                <span className="text-muted-foreground" data-testid={`text-client-name-${visit.id}`}>
                                  {visit.cliente.fullName}
                                </span>
                              </div>
                              {visit.cliente.phone && (
                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                  <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <span className="text-muted-foreground" data-testid={`text-client-phone-${visit.id}`}>
                                    {visit.cliente.phone}
                                  </span>
                                </div>
                              )}
                            </div>
                            {visit.cliente.phone && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                asChild
                                data-testid={`button-call-client-${visit.id}`}
                              >
                                <a href={`tel:${visit.cliente.phone}`}>
                                  <Phone className="h-3.5 w-3.5 mr-2" />
                                  Ligar para o Cliente
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {visit.observacoes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium mb-1">Observações:</p>
                          <p className="text-xs text-muted-foreground">{visit.observacoes}</p>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t space-y-2">
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

          {paginatedVisits && paginatedVisits.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                  Página {currentPage} de {paginatedVisits.totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(paginatedVisits.totalPages, prev + 1))}
                disabled={currentPage === paginatedVisits.totalPages || isLoading}
                data-testid="button-next-page"
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      <Dialog open={showProposeDialog} onOpenChange={(open) => !open && handleCloseProposeDialog()}>
        <DialogContent data-testid="dialog-propose-date">
          <DialogHeader>
            <DialogTitle>Propor Nova Data</DialogTitle>
            <DialogDescription>
              Sugira uma nova data e horário para a visita. O cliente será notificado da sua proposta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proposed-date">Data</Label>
              <Input
                id="proposed-date"
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                data-testid="input-proposed-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposed-time">Horário</Label>
              <Input
                id="proposed-time"
                type="time"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                data-testid="input-proposed-time"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-message">Mensagem (opcional)</Label>
              <Textarea
                id="owner-message"
                placeholder="Adicione uma mensagem para o cliente..."
                value={ownerMessage}
                onChange={(e) => setOwnerMessage(e.target.value)}
                rows={3}
                data-testid="textarea-owner-message"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleCloseProposeDialog}
              data-testid="button-cancel-propose"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProposeDate}
              disabled={ownerResponseMutation.isPending}
              data-testid="button-submit-propose"
            >
              {ownerResponseMutation.isPending ? 'Enviando...' : 'Enviar Proposta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

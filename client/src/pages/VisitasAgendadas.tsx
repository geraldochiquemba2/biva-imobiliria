import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, Clock, MapPin, User, ArrowLeft, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { User as UserType } from "@shared/schema";
import emptyStateImage from "@assets/stock_images/empty_calendar_sched_60cbbdfd.jpg";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Visit {
  id: string;
  propertyId: string;
  clienteId: string;
  dataHora: string;
  status: string;
  observacoes: string | null;
  createdAt: string;
  property?: {
    title: string;
    bairro: string;
    municipio: string;
    provincia: string;
    images?: string[];
  };
  cliente?: {
    fullName: string;
    phone: string;
  };
}

export default function VisitasAgendadas() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
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

  const scheduledVisits = visits?.filter(v => v.status === 'agendada') || [];
  
  const handleGoBack = () => {
    window.history.length > 1 ? window.history.back() : setLocation('/');
  };

  const handleCancelVisit = (visitId: string) => {
    cancelVisitMutation.mutate(visitId);
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

          {scheduledVisits.length === 0 ? (
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {scheduledVisits.map((visit) => (
                <motion.div
                  key={visit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="hover-elevate">
                    {visit.property?.images && visit.property.images.length > 0 && (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img
                          src={visit.property.images[0]}
                          alt={visit.property.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <CardTitle data-testid={`text-property-title-${visit.id}`}>
                              {visit.property?.title || 'Imóvel'}
                            </CardTitle>
                          </div>
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {visit.property?.bairro}, {visit.property?.municipio}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={visit.status === 'agendada' ? 'default' : visit.status === 'concluida' ? 'secondary' : 'destructive'}
                          data-testid={`badge-status-${visit.id}`}
                        >
                          {visit.status === 'agendada' ? 'Agendada' : 
                           visit.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Data:</span>
                          <span className="text-muted-foreground" data-testid={`text-date-${visit.id}`}>
                            {format(new Date(visit.dataHora), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Horário:</span>
                          <span className="text-muted-foreground" data-testid={`text-time-${visit.id}`}>
                            {format(new Date(visit.dataHora), 'HH:mm', { locale: ptBR })}
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

                      <div className="mt-4 pt-4 border-t">
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
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

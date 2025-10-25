import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { User as UserType } from "@shared/schema";

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
  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/auth/me'],
  });

  const { data: visits, isLoading } = useQuery<Visit[]>({
    queryKey: ['/api/visits'],
    enabled: !!currentUser,
  });

  const scheduledVisits = visits?.filter(v => v.status === 'agendada') || [];

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
            <h1 className="text-4xl font-bold mb-2">Visitas Agendadas</h1>
            <p className="text-muted-foreground">
              Acompanhe suas visitas programadas aos imóveis
            </p>
          </div>

          {scheduledVisits.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma visita agendada</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Você ainda não possui visitas agendadas. Quando você agendar uma visita a um imóvel, ela aparecerá aqui.
                </p>
              </CardContent>
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
                      <div className="aspect-video overflow-hidden">
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

                        {currentUser?.userType !== 'cliente' && visit.cliente && (
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

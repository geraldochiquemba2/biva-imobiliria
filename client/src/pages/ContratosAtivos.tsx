import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, DollarSign, FileText, User, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { User as UserType } from "@shared/schema";
import emptyStateImage from "@assets/stock_images/contract_document_si_a2777db9.jpg";
import { useLocation } from "wouter";

interface Contract {
  id: string;
  propertyId: string;
  proprietarioId: string;
  clienteId: string;
  tipo: string;
  valor: string;
  dataInicio: string;
  dataFim: string | null;
  status: string;
  observacoes: string | null;
  createdAt: string;
  property?: {
    title: string;
    bairro: string;
    municipio: string;
    images?: string[];
  };
  proprietario?: {
    fullName: string;
    phone: string;
  };
  cliente?: {
    fullName: string;
    phone: string;
  };
}

export default function ContratosAtivos() {
  const [, setLocation] = useLocation();
  
  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/auth/me'],
  });

  const { data: contracts, isLoading } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
    enabled: !!currentUser,
  });

  const activeContracts = contracts?.filter(c => c.status === 'ativo') || [];
  
  const handleGoBack = () => {
    window.history.length > 1 ? window.history.back() : setLocation('/');
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
                <h1 className="text-4xl font-bold">Contratos Ativos</h1>
              </div>
            </div>
            <p className="text-muted-foreground">
              Gerencie seus contratos de arrendamento e venda em andamento
            </p>
          </div>

          {activeContracts.length === 0 ? (
            <Card className="overflow-hidden">
              <div 
                className="relative bg-cover bg-center"
                style={{ backgroundImage: `url(${emptyStateImage})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
                <CardContent className="relative flex flex-col items-center justify-center py-16 text-white">
                  <FileText className="h-16 w-16 mb-4 opacity-90" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum contrato ativo</h3>
                  <p className="text-white/90 text-center max-w-md">
                    Você ainda não possui contratos ativos. Quando um contrato for criado, ele aparecerá aqui.
                  </p>
                </CardContent>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {activeContracts.map((contract) => (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="hover-elevate">
                    {contract.property?.images && contract.property.images.length > 0 && (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img
                          src={contract.property.images[0]}
                          alt={contract.property.title}
                          className="w-full h-full object-cover"
                          data-testid={`img-property-${contract.id}`}
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <CardTitle data-testid={`text-property-title-${contract.id}`}>
                              {contract.property?.title || 'Imóvel'}
                            </CardTitle>
                          </div>
                          <CardDescription>
                            {contract.property?.bairro}, {contract.property?.municipio}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={contract.status === 'ativo' ? 'default' : 'secondary'}
                          data-testid={`badge-status-${contract.id}`}
                        >
                          {contract.status === 'ativo' ? 'Ativo' : contract.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Tipo:</span>
                            <span className="text-muted-foreground capitalize">
                              {contract.tipo}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Valor:</span>
                            <span className="text-muted-foreground" data-testid={`text-valor-${contract.id}`}>
                              {new Intl.NumberFormat('pt-AO', {
                                style: 'currency',
                                currency: 'AOA'
                              }).format(Number(contract.valor))}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Início:</span>
                            <span className="text-muted-foreground">
                              {format(new Date(contract.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>

                          {contract.dataFim && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Término:</span>
                              <span className="text-muted-foreground">
                                {format(new Date(contract.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          {!currentUser?.userTypes?.includes('cliente') && contract.cliente && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Cliente:</span>
                              <span className="text-muted-foreground">
                                {contract.cliente.fullName}
                              </span>
                            </div>
                          )}

                          {currentUser?.userTypes?.includes('cliente') && contract.proprietario && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Proprietário:</span>
                              <span className="text-muted-foreground">
                                {contract.proprietario.fullName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {contract.observacoes && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-1">Observações:</p>
                          <p className="text-sm text-muted-foreground">{contract.observacoes}</p>
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

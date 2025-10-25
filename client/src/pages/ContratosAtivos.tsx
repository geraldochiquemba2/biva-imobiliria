import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, DollarSign, FileText, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { User as UserType } from "@shared/schema";

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
  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/auth/me'],
  });

  const { data: contracts, isLoading } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
    enabled: !!currentUser,
  });

  const activeContracts = contracts?.filter(c => c.status === 'ativo') || [];

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
            <h1 className="text-4xl font-bold mb-2">Contratos Ativos</h1>
            <p className="text-muted-foreground">
              Gerencie seus contratos de arrendamento e venda em andamento
            </p>
          </div>

          {activeContracts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum contrato ativo</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Você ainda não possui contratos ativos. Quando um contrato for criado, ele aparecerá aqui.
                </p>
              </CardContent>
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

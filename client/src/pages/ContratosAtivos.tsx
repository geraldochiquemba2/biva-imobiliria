import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Calendar, DollarSign, FileText, User, ArrowLeft, Phone, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { User as UserType } from "@shared/schema";
import emptyStateImage from "@assets/stock_images/contract_document_si_a2777db9.jpg";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

  // Show both active and pending contracts
  const relevantContracts = contracts?.filter(c => 
    c.status === 'ativo' || 
    c.status === 'pendente_assinaturas' ||
    c.status === 'assinado_proprietario' ||
    c.status === 'assinado_cliente'
  ) || [];

  // Separate by type
  const contratosvenda = relevantContracts.filter(c => c.tipo === 'venda');
  const contratosArrendamento = relevantContracts.filter(c => c.tipo === 'arrendamento');
  
  const handleGoBack = () => {
    window.history.length > 1 ? window.history.back() : setLocation('/');
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return { variant: 'default' as const, label: 'Ativo', className: '' };
      case 'pendente_assinaturas':
        return { variant: 'outline' as const, label: 'Aguardando Assinaturas', className: 'border-yellow-500 text-yellow-700 dark:text-yellow-400' };
      case 'assinado_proprietario':
        return { variant: 'outline' as const, label: 'Aguardando Cliente', className: 'border-blue-500 text-blue-700 dark:text-blue-400' };
      case 'assinado_cliente':
        return { variant: 'outline' as const, label: 'Aguardando Proprietário', className: 'border-blue-500 text-blue-700 dark:text-blue-400' };
      default:
        return { variant: 'secondary' as const, label: status, className: '' };
    }
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
                <h1 className="text-4xl font-bold">Meus Contratos</h1>
              </div>
            </div>
            <p className="text-muted-foreground">
              Gerencie seus contratos ativos e pendentes de assinatura
            </p>
          </div>

          {relevantContracts.length === 0 ? (
            <Card className="overflow-hidden">
              <div 
                className="relative bg-cover bg-center"
                style={{ backgroundImage: `url(${emptyStateImage})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
                <CardContent className="relative flex flex-col items-center justify-center py-16 text-white">
                  <FileText className="h-16 w-16 mb-4 opacity-90" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum contrato</h3>
                  <p className="text-white/90 text-center max-w-md">
                    Você ainda não possui contratos. Quando um contrato for criado, ele aparecerá aqui.
                  </p>
                </CardContent>
              </div>
            </Card>
          ) : (
            <Tabs defaultValue="venda" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6" data-testid="tabs-contract-type">
                <TabsTrigger value="venda" data-testid="tab-venda">
                  Contratos de Venda ({contratosvenda.length})
                </TabsTrigger>
                <TabsTrigger value="arrendamento" data-testid="tab-arrendamento">
                  Contratos de Arrendamento ({contratosArrendamento.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="venda" className="space-y-6">
                {contratosvenda.length === 0 ? (
                  <Card className="overflow-hidden">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-12 w-12 mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum contrato de venda</h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        Você ainda não possui contratos de venda.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {contratosvenda.map((contract) => (
                      <ContractCard key={contract.id} contract={contract} currentUser={currentUser} setLocation={setLocation} getStatusBadge={getStatusBadge} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="arrendamento" className="space-y-6">
                {contratosArrendamento.length === 0 ? (
                  <Card className="overflow-hidden">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-12 w-12 mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum contrato de arrendamento</h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        Você ainda não possui contratos de arrendamento.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {contratosArrendamento.map((contract) => (
                      <ContractCard key={contract.id} contract={contract} currentUser={currentUser} setLocation={setLocation} getStatusBadge={getStatusBadge} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function ContractCard({ 
  contract, 
  currentUser, 
  setLocation, 
  getStatusBadge 
}: { 
  contract: Contract; 
  currentUser: UserType | undefined; 
  setLocation: (path: string) => void;
  getStatusBadge: (status: string) => { variant: any; label: string; className: string };
}) {
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: async (contractId: string) => {
      return await apiRequest(`/api/contracts/${contractId}/cancel`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      toast({
        title: "Contrato cancelado",
        description: "O contrato foi cancelado com sucesso.",
      });
      setShowCancelDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message || "Não foi possível cancelar o contrato.",
        variant: "destructive",
      });
    },
  });

  const handleCancelContract = () => {
    cancelMutation.mutate(contract.id);
  };

  const canCancelContract = contract.status !== 'ativo' && contract.status !== 'cancelado' && contract.status !== 'encerrado';

  return (
    <motion.div
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
              variant={getStatusBadge(contract.status).variant}
              data-testid={`badge-status-${contract.id}`}
            >
              {getStatusBadge(contract.status).label}
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
              {contract.cliente && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Cliente:</span>
                    <span className="text-muted-foreground" data-testid={`text-cliente-${contract.id}`}>
                      {contract.cliente.fullName}
                    </span>
                  </div>
                  {contract.cliente.phone && (
                    <div className="flex items-center gap-2 text-sm pl-6">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">
                        {contract.cliente.phone}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {contract.proprietario && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Proprietário:</span>
                    <span className="text-muted-foreground" data-testid={`text-proprietario-${contract.id}`}>
                      {contract.proprietario.fullName}
                    </span>
                  </div>
                  {contract.proprietario.phone && (
                    <div className="flex items-center gap-2 text-sm pl-6">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">
                        {contract.proprietario.phone}
                      </span>
                    </div>
                  )}
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
          
          {contract.status !== 'ativo' && (
            <div className="mt-4 pt-4 border-t flex gap-3">
              <Button
                onClick={() => setLocation(`/contratos/${contract.id}/assinar`)}
                className="flex-1"
                data-testid={`button-sign-contract-${contract.id}`}
              >
                {contract.status === 'pendente_assinaturas' 
                  ? 'Assinar Contrato' 
                  : 'Ver Contrato'}
              </Button>
              
              {canCancelContract && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  data-testid={`button-cancel-contract-${contract.id}`}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este contrato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-dialog-close">
              Não, manter contrato
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelContract}
              disabled={cancelMutation.isPending}
              data-testid="button-cancel-dialog-confirm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending ? "Cancelando..." : "Sim, cancelar contrato"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, FileText, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Contract, User } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import logoUrl from "@assets/BIVA LOG300.300_1761489547620.png";

export default function ContractSign() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [biNumber, setBiNumber] = useState("");
  const [signDialogOpen, setSignDialogOpen] = useState(false);

  // Get current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  // Get contract
  const { data: contract, isLoading: isLoadingContract } = useQuery<Contract>({
    queryKey: ['/api/contracts', id],
    enabled: !!id,
  });

  // Sign contract mutation
  const signMutation = useMutation({
    mutationFn: async (data: { contractId: string; bi: string }) => {
      const response = await fetch(`/api/contracts/${data.contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bi: data.bi }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao assinar contrato');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contrato assinado com sucesso!",
        description: "A sua assinatura digital foi registada.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', id] });
      setSignDialogOpen(false);
      setBiNumber("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao assinar contrato",
        description: error.message || "Por favor, verifique o seu número de BI/Passaporte.",
      });
    },
  });

  // Split contract content into pages (approximately 32 lines per A4 page to leave space for footer)
  const contractPages = useMemo(() => {
    if (!contract?.contractContent) return [];
    
    const lines = contract.contractContent.split('\n');
    const linesPerPage = 32; // Reduced to ensure text doesn't overlap with footer
    const pages: string[][] = [];
    
    for (let i = 0; i < lines.length; i += linesPerPage) {
      pages.push(lines.slice(i, i + linesPerPage));
    }
    
    return pages;
  }, [contract?.contractContent]);

  const handleSign = () => {
    if (!id || !biNumber) return;
    signMutation.mutate({ contractId: id, bi: biNumber });
  };

  const canSign = () => {
    if (!contract || !currentUser) return false;
    
    // Proprietario can sign if they haven't signed yet
    if (currentUser.id === contract.proprietarioId && !contract.proprietarioSignedAt) {
      return true;
    }
    
    // Cliente can sign if they haven't signed yet
    if (currentUser.id === contract.clienteId && !contract.clienteSignedAt) {
      return true;
    }
    
    return false;
  };

  const getSignatureStatus = () => {
    if (!contract) return null;

    const proprietarioSigned = !!contract.proprietarioSignedAt;
    const clienteSigned = !!contract.clienteSignedAt;

    if (proprietarioSigned && clienteSigned) {
      return { status: 'completed', message: 'Contrato totalmente assinado', variant: 'default' as const };
    }

    if (!proprietarioSigned && !clienteSigned) {
      return { status: 'pending', message: 'Aguardando ambas as assinaturas', variant: 'secondary' as const };
    }

    return { status: 'partial', message: 'Assinado parcialmente', variant: 'secondary' as const };
  };

  if (isLoadingUser || isLoadingContract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contract || !currentUser) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>Contrato não encontrado</p>
          </div>
        </Card>
      </div>
    );
  }

  const signatureStatus = getSignatureStatus();

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Contrato de Arrendamento</h1>
          </div>
          {signatureStatus && (
            <Badge variant={signatureStatus.variant} data-testid="badge-status">
              {signatureStatus.message}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Contrato ID: {contract.id}
        </p>
      </div>

      {/* Contract Info Card */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <p className="font-medium capitalize" data-testid="text-type">{contract.tipo}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Valor Mensal</Label>
            <p className="font-medium" data-testid="text-value">
              {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(parseFloat(contract.valor))}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Data de Início</Label>
            <p className="font-medium flex items-center gap-1" data-testid="text-start-date">
              <Calendar className="h-3 w-3" />
              {contract.dataInicio && format(new Date(contract.dataInicio), "dd/MM/yyyy")}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Data de Término</Label>
            <p className="font-medium flex items-center gap-1" data-testid="text-end-date">
              <Calendar className="h-3 w-3" />
              {contract.dataFim && format(new Date(contract.dataFim), "dd/MM/yyyy")}
            </p>
          </div>
        </div>
      </Card>

      {/* Signature Status Card */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Estado das Assinaturas</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Proprietário</p>
              <p className="text-sm text-muted-foreground">Senhorio/Arrendador</p>
            </div>
            {contract.proprietarioSignedAt ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <div className="text-right">
                  <p className="text-sm font-medium">Assinado</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.proprietarioSignedAt && format(new Date(contract.proprietarioSignedAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>
            ) : (
              <Badge variant="secondary">Pendente</Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Inquilino</p>
              <p className="text-sm text-muted-foreground">Cliente/Arrendatário</p>
            </div>
            {contract.clienteSignedAt ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <div className="text-right">
                  <p className="text-sm font-medium">Assinado</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.clienteSignedAt && format(new Date(contract.clienteSignedAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>
            ) : (
              <Badge variant="secondary">Pendente</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Action Button */}
      {canSign() && (
        <Card className="p-6 mb-6 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Pronto para Assinar?</h3>
              <p className="text-sm text-muted-foreground">
                Por favor, assine o contrato digitalmente para prosseguir.
              </p>
            </div>
            <Button 
              onClick={() => setSignDialogOpen(true)}
              data-testid="button-sign-contract"
            >
              Assinar Contrato
            </Button>
          </div>
        </Card>
      )}

      {/* Contract Content - A4 Page Format */}
      <div className="mb-6" style={{ backgroundColor: '#f3f4f6' }}>
        <div className="p-6 border-b bg-white">
          <h3 className="font-semibold text-gray-900">Conteúdo do Contrato</h3>
          <p className="text-sm text-gray-600 mt-1">
            {contractPages.length} {contractPages.length === 1 ? 'página' : 'páginas'}
          </p>
        </div>
        
        {/* Document viewer with A4 pages */}
        <div className="p-8" style={{ backgroundColor: '#f3f4f6' }}>
          <div className="max-w-[210mm] mx-auto space-y-6">
            {contractPages.map((pageLines, pageIndex) => (
              <div 
                key={pageIndex}
                className="shadow-2xl relative overflow-hidden" 
                style={{ 
                  width: '210mm', 
                  height: '297mm', 
                  padding: '25mm 20mm',
                  pageBreakAfter: 'always',
                  backgroundColor: '#ffffff',
                  color: '#1a1a1a'
                }}
              >
                {/* Logo in top-left corner */}
                <div className="absolute top-[2mm] left-[16mm]" style={{ zIndex: 5 }}>
                  <img 
                    src={logoUrl} 
                    alt="BIVA Imobiliária" 
                    className="w-32 h-32 object-contain"
                  />
                </div>

                {/* Decorative header border */}
                <div className="border-t-4 border-b-2 border-primary/30 py-3 mb-6">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span className="font-semibold">DOCUMENTO OFICIAL</span>
                    <span>Conforme Lei n.º 26/15 de 23 de Outubro</span>
                  </div>
                </div>
                
                {/* Watermark background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30" style={{ zIndex: 0 }}>
                  <img 
                    src={logoUrl} 
                    alt="BIVA Imobiliária" 
                    className="w-96 h-96 object-contain"
                  />
                </div>
                
                {/* Contract content */}
                <div className="relative overflow-hidden" style={{ 
                  minHeight: 'calc(297mm - 50mm - 120px)',
                  maxHeight: 'calc(297mm - 50mm - 120px)',
                  zIndex: 1,
                  paddingBottom: '10px'
                }}>
                  <div 
                    className="font-serif text-sm m-0 bg-transparent text-black dark:text-black p-0" 
                    data-testid={pageIndex === 0 ? "text-contract-content" : undefined}
                    style={{ 
                      fontFamily: 'Georgia, serif', 
                      color: '#1a1a1a', 
                      backgroundColor: 'transparent',
                      lineHeight: '1.8',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      orphans: 3,
                      widows: 3
                    }}
                  >
                    {pageLines.map((line, idx) => {
                      const isClausulaTitle = line.trim().startsWith('Cláusula');
                      const isEmpty = line.trim() === '';
                      
                      return (
                        <div 
                          key={idx}
                          style={{
                            textAlign: isClausulaTitle ? 'center' : 'justify',
                            fontWeight: isClausulaTitle ? 'bold' : 'normal',
                            marginBottom: isEmpty ? '0' : undefined
                          }}
                        >
                          {line || '\u00A0'}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Page footer */}
                <div className="absolute bottom-[20mm] left-[20mm] right-[20mm] pt-4 border-t border-gray-300 bg-white" style={{ zIndex: 10 }}>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div>
                      <p className="font-semibold">ID: {contract.id.substring(0, 8).toUpperCase()}</p>
                      <p>Data de Emissão: {format(new Date(contract.createdAt), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Página {pageIndex + 1} de {contractPages.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sign Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent data-testid="dialog-sign">
          <DialogHeader>
            <DialogTitle>Assinar Contrato Digitalmente</DialogTitle>
            <DialogDescription>
              Por favor, forneça o seu número de Bilhete de Identidade ou Passaporte para confirmar a assinatura digital.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="bi">BI / Passaporte</Label>
              <Input
                id="bi"
                placeholder="Ex: 000000000LA000"
                value={biNumber}
                onChange={(e) => setBiNumber(e.target.value)}
                data-testid="input-bi"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este número deve corresponder ao cadastrado no seu perfil.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Aviso Legal
                  </p>
                  <p className="text-amber-800 dark:text-amber-200">
                    Ao assinar este contrato digitalmente, você concorda com todos os termos e condições estabelecidos conforme a Lei n.º 26/15 do Arrendamento Urbano de Angola.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSignDialogOpen(false)}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSign}
              disabled={!biNumber || signMutation.isPending}
              data-testid="button-confirm-sign"
            >
              {signMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assinando...
                </>
              ) : (
                'Confirmar Assinatura'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

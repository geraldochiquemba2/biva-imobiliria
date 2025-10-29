import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, FileText, Calendar, AlertCircle, Loader2, Eraser, Camera, Upload, Crop, Download } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo, useRef, useCallback } from "react";
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
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { generateContractPDFFromPages } from "@/lib/pdfGenerator";

export default function ContractSign() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [biNumber, setBiNumber] = useState("");
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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
    mutationFn: async (data: { contractId: string; bi: string; signatureImage: string }) => {
      const response = await fetch(`/api/contracts/${data.contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bi: data.bi, signatureImage: data.signatureImage }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao assinar contrato');
      }

      return response.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/contracts', id], refetchType: 'all' }),
      ]);
      toast({
        title: "Contrato assinado com sucesso!",
        description: "A sua assinatura digital foi registada. Agora você pode confirmar.",
      });
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

  // Confirm contract mutation
  const confirmMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const response = await apiRequest('POST', `/api/contracts/${contractId}/confirm`, {});
      return await response.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/contracts', id], refetchType: 'all' }),
      ]);
      toast({
        title: "Contrato confirmado com sucesso!",
        description: "Aguardando confirmação da outra parte.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao confirmar contrato",
        description: error.message || "Erro desconhecido.",
      });
    },
  });

  // Cancel contract mutation
  const cancelMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const response = await apiRequest('POST', `/api/contracts/${contractId}/cancel`, {});
      return await response.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/contracts', id], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/contracts'], refetchType: 'all' }),
      ]);
      toast({
        title: "Contrato cancelado",
        description: "O contrato foi cancelado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar contrato",
        description: error.message || "Não foi possível cancelar o contrato.",
      });
    },
  });

  // Split contract content into pages (respecting page breaks \f)
  const contractPages = useMemo(() => {
    if (!contract?.contractContent) return [];

    // First split by form feed character for explicit page breaks
    const pageBreaks = contract.contractContent.split('\f');
    const pages: string[][] = [];

    pageBreaks.forEach((pageContent) => {
      const lines = pageContent.split('\n');
      const linesPerPage = 32;

      // If page content is small enough, keep it on one page
      if (lines.length <= linesPerPage) {
        pages.push(lines);
      } else {
        // If too large, split into multiple pages
        for (let i = 0; i < lines.length; i += linesPerPage) {
          pages.push(lines.slice(i, i + linesPerPage));
        }
      }
    });

    return pages;
  }, [contract?.contractContent]);

  const handleSign = () => {
    if (!id || !biNumber || !uploadedSignature) {
      toast({
        variant: "destructive",
        title: "Assinatura incompleta",
        description: "Por favor, preencha o número de BI e faça upload da sua assinatura.",
      });
      return;
    }

    signMutation.mutate({ contractId: id, bi: biNumber, signatureImage: uploadedSignature });
  };

  const handleOpenSignDialog = () => {
    if (currentUser?.bi) {
      setBiNumber(currentUser.bi);
    }
    setUploadedSignature(null);
    setSignDialogOpen(true);
  };

  const processSignatureImage = (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const brightness = (r + g + b) / 3;

          if (brightness > 200) {
            data[i + 3] = 0;
          } else {
            const darkness = 255 - brightness;
            data[i] = Math.max(0, r - 50);
            data[i + 1] = Math.max(0, g - 50);
            data[i + 2] = Math.max(0, b - 50);
            data[i + 3] = Math.min(255, darkness * 1.5);
          }
        }

        ctx.putImageData(imageData, 0, 0);

        const bounds = {
          minX: canvas.width,
          minY: canvas.height,
          maxX: 0,
          maxY: 0
        };

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            if (data[i + 3] > 50) {
              bounds.minX = Math.min(bounds.minX, x);
              bounds.minY = Math.min(bounds.minY, y);
              bounds.maxX = Math.max(bounds.maxX, x);
              bounds.maxY = Math.max(bounds.maxY, y);
            }
          }
        }

        const padding = 20;
        const cropX = Math.max(0, bounds.minX - padding);
        const cropY = Math.max(0, bounds.minY - padding);
        const cropWidth = Math.min(canvas.width - cropX, bounds.maxX - bounds.minX + padding * 2);
        const cropHeight = Math.min(canvas.height - cropY, bounds.maxY - bounds.minY + padding * 2);

        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        if (!croppedCtx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;

        croppedCtx.putImageData(
          ctx.getImageData(cropX, cropY, cropWidth, cropHeight),
          0,
          0
        );

        resolve(croppedCanvas.toDataURL('image/png'));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Arquivo inválido",
          description: "Por favor, selecione uma imagem.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setImageToCrop(result);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (): Promise<string> => {
    if (!imageToCrop || !croppedAreaPixels) {
      throw new Error('No image to crop');
    }

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = imageToCrop;
    });
  };

  const handleConfirmCrop = async () => {
    try {
      toast({
        title: "Processando assinatura...",
        description: "Recortando e otimizando a imagem.",
      });

      const croppedImage = await createCroppedImage();
      const processedImage = await processSignatureImage(croppedImage);

      setUploadedSignature(processedImage);
      setIsCropping(false);
      setImageToCrop(null);

      toast({
        title: "Assinatura processada!",
        description: "Imagem recortada e fundo removido com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao processar imagem",
        description: "Tente novamente.",
      });
    }
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveUploadedSignature = () => {
    setUploadedSignature(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const canConfirm = () => {
    if (!contract || !currentUser) return false;

    // Proprietario can confirm if they signed but haven't confirmed yet
    if (currentUser.id === contract.proprietarioId && contract.proprietarioSignedAt && !contract.proprietarioConfirmedAt) {
      return true;
    }

    // Cliente can confirm if they signed but haven't confirmed yet
    if (currentUser.id === contract.clienteId && contract.clienteSignedAt && !contract.clienteConfirmedAt) {
      return true;
    }

    return false;
  };

  const handleConfirm = () => {
    if (!id) return;
    confirmMutation.mutate(id);
  };

  const handleCancel = () => {
    if (!id) return;
    if (confirm("Tem certeza que deseja cancelar este contrato? Esta ação não pode ser desfeita.")) {
      cancelMutation.mutate(id);
    }
  };

  const canCancel = () => {
    if (!contract || !currentUser) return false;

    // Can only cancel if not active yet
    if (contract.status === 'ativo' || contract.status === 'cancelado' || contract.status === 'encerrado') {
      return false;
    }

    // User must be part of the contract
    return contract.proprietarioId === currentUser.id || contract.clienteId === currentUser.id;
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

  const handleExtractPdf = async () => {
    if (!contract) return;
    
    try {
      toast({ title: "Gerando PDF...", description: "Por favor, aguarde enquanto o PDF é gerado." });

      // Generate PDF from the current pages
      await generateContractPDFFromPages({
        contractPages,
        contract,
        logoUrl,
      });

      toast({ title: "PDF gerado com sucesso!", description: "O contrato foi baixado em formato PDF." });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: error.message || "Não foi possível gerar o PDF. Tente novamente mais tarde.",
      });
    }
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

      {/* Action Buttons */}
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
              onClick={handleOpenSignDialog}
              data-testid="button-sign-contract"
            >
              Assinar Contrato
            </Button>
          </div>
        </Card>
      )}

      {canConfirm() && (
        <Card className="p-6 mb-6 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Pronto para Confirmar?</h3>
              <p className="text-sm text-muted-foreground">
                Você já assinou. Agora confirme para ativar o contrato.
              </p>
            </div>
            <Button 
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
              data-testid="button-confirm-contract"
              className="bg-green-600 hover:bg-green-700"
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar Contrato'
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Contract Content - A4 Page Format */}
      <div className="mb-6" style={{ backgroundColor: '#f3f4f6' }}>
        <div className="p-4 md:p-6 border-b bg-white flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-900">Conteúdo do Contrato</h3>
            <p className="text-sm text-gray-600 mt-1">
              {contractPages.length} {contractPages.length === 1 ? 'página' : 'páginas'}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleExtractPdf}
            data-testid="button-extract-pdf"
          >
            <Download className="h-4 w-4 mr-2" />
            Extrair PDF
          </Button>
        </div>

        {/* Document viewer with A4 pages */}
        <div className="p-2 md:p-8" style={{ backgroundColor: '#f3f4f6' }}>
          <div className="w-full max-w-full md:max-w-[210mm] mx-auto space-y-6">
            {contractPages.map((pageLines, pageIndex) => (
              <div 
                key={pageIndex}
                className="shadow-2xl relative overflow-hidden w-full min-h-[700px] md:min-h-[297mm]"
                style={{ 
                  paddingTop: '100px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingBottom: '16px',
                  pageBreakAfter: 'always',
                  backgroundColor: '#ffffff',
                  color: '#1a1a1a'
                }}
              >
                {/* Logo in top-left corner */}
                <div className="absolute top-2 left-4 md:top-[2mm] md:left-[16mm]" style={{ zIndex: 5 }}>
                  <img 
                    src={logoUrl} 
                    alt="BIVA Imobiliária" 
                    className="w-20 h-20 md:w-32 md:h-32 object-contain"
                  />
                </div>

                {/* Decorative header border */}
                <div className="border-t-4 border-b-2 border-primary/30 py-2 md:py-3 mb-4 md:mb-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-xs text-gray-600 gap-1">
                    <span className="font-semibold">DOCUMENTO OFICIAL</span>
                    <span className="text-[10px] md:text-xs">Conforme Lei n.º 26/15 de 23 de Outubro</span>
                  </div>
                </div>

                {/* Watermark background */}
                <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none opacity-30" style={{ zIndex: 0 }}>
                  <img 
                    src={logoUrl} 
                    alt="BIVA Imobiliária" 
                    className="w-64 h-64 md:w-96 md:h-96 object-contain"
                  />
                </div>

                {/* Contract content */}
                <div className="relative" style={{ 
                  zIndex: 1,
                  paddingBottom: '80px'
                }}>
                  <div 
                    className="font-serif text-xs md:text-sm m-0 bg-transparent text-black dark:text-black p-0" 
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
                      const isClausulasSection = line.trim() === 'CLÁUSULAS CONTRATUAIS';
                      const isEmpty = line.trim() === '';
                      const isSignatureLine = line.trim().startsWith('_____');

                      // Determine if this is proprietario or cliente signature line
                      let showProprietarioSignature = false;
                      let showClienteSignature = false;

                      if (isSignatureLine) {
                        // Look at next lines to determine context (signature line comes before name)
                        const nextLines = pageLines.slice(idx + 1, Math.min(pageLines.length, idx + 4)).join(' ');
                        if (nextLines.includes('SENHORIO') || nextLines.includes('Proprietário')) {
                          showProprietarioSignature = true;
                        } else if (nextLines.includes('INQUILINO') || nextLines.includes('Arrendatário')) {
                          showClienteSignature = true;
                        }
                      }

                      return (
                        <div 
                          key={idx}
                          style={{
                            textAlign: (isClausulaTitle || isClausulasSection) ? 'center' : 'justify',
                            fontWeight: (isClausulaTitle || isClausulasSection) ? 'bold' : 'normal',
                            marginBottom: isEmpty ? '0' : undefined,
                            pageBreakAfter: (isClausulaTitle || isClausulasSection) ? 'avoid' : 'auto',
                            pageBreakInside: 'avoid',
                            breakAfter: (isClausulaTitle || isClausulasSection) ? 'avoid' : 'auto',
                            breakInside: 'avoid'
                          }}
                        >
                          {isSignatureLine && showProprietarioSignature && contract.proprietarioSignature ? (
                            contract.proprietarioSignature.startsWith('data:image/') ? (
                              <div className="flex flex-col items-start my-2">
                                <img 
                                  src={contract.proprietarioSignature} 
                                  alt="Assinatura do Proprietário" 
                                  className="mb-1 max-w-[200px] md:max-w-[265px] h-auto max-h-[45px] md:max-h-[52px] object-contain object-left"
                                  style={{ 
                                    objectFit: 'contain',
                                    objectPosition: 'left'
                                  }}
                                  onError={(e) => {
                                    console.error('Failed to load proprietario signature');
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <div className="text-xs text-gray-600">
                                  Assinado digitalmente em {contract.proprietarioSignedAt && format(new Date(contract.proprietarioSignedAt), "dd/MM/yyyy HH:mm")}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-start my-2">
                                <div className="text-xs text-red-600 italic">
                                  [Assinatura inválida - formato incorreto]
                                </div>
                                <div className="text-xs text-gray-600">
                                  Data: {contract.proprietarioSignedAt && format(new Date(contract.proprietarioSignedAt), "dd/MM/yyyy HH:mm")}
                                </div>
                              </div>
                            )
                          ) : isSignatureLine && showClienteSignature && contract.clienteSignature ? (
                            contract.clienteSignature.startsWith('data:image/') ? (
                              <div className="flex flex-col items-start my-2">
                                <img 
                                  src={contract.clienteSignature} 
                                  alt="Assinatura do Cliente" 
                                  className="mb-1 max-w-[200px] md:max-w-[265px] h-auto max-h-[45px] md:max-h-[52px] object-contain object-left"
                                  style={{ 
                                    objectFit: 'contain',
                                    objectPosition: 'left'
                                  }}
                                  onError={(e) => {
                                    console.error('Failed to load cliente signature');
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <div className="text-xs text-gray-600">
                                  Assinado digitalmente em {contract.clienteSignedAt && format(new Date(contract.clienteSignedAt), "dd/MM/yyyy HH:mm")}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-start my-2">
                                <div className="text-xs text-red-600 italic">
                                  [Assinatura inválida - formato incorreto]
                                </div>
                                <div className="text-xs text-gray-600">
                                  Data: {contract.clienteSignedAt && format(new Date(contract.clienteSignedAt), "dd/MM/yyyy HH:mm")}
                                </div>
                              </div>
                            )
                          ) : (
                            line || '\u00A0'
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Page footer */}
                <div className="absolute bottom-4 left-4 right-4 md:bottom-[20mm] md:left-[20mm] md:right-[20mm] pt-3 md:pt-4 border-t border-gray-300 bg-white" style={{ zIndex: 10 }}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-[10px] md:text-xs text-gray-500 gap-2 md:gap-0">
                    <div>
                      <p className="font-semibold">ID: {contract.id.substring(0, 8).toUpperCase()}</p>
                      <p>Data de Emissão: {format(new Date(contract.createdAt), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="text-left md:text-right">
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
        <DialogContent data-testid="dialog-sign" className="max-h-[95vh] flex flex-col p-0 gap-0">
          <div className="p-6 pb-4">
            <DialogHeader>
              <DialogTitle>Assinar Contrato Digitalmente</DialogTitle>
              <DialogDescription>
                Por favor, forneça o seu número de Bilhete de Identidade ou Passaporte para confirmar a assinatura digital.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 overflow-y-auto px-6 pb-4 flex-1">
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
                {currentUser?.bi 
                  ? "Número preenchido automaticamente do seu perfil. Você pode editá-lo se necessário."
                  : "Este número será salvo automaticamente no seu perfil ao assinar."}
              </p>
            </div>

            <div>
              <Label className="mb-3">Assinatura</Label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-file-signature"
              />

              {isCropping && imageToCrop ? (
                    <div className="space-y-3">
                      <div className="relative h-80 border-2 border-muted-foreground/30 rounded-lg bg-background overflow-hidden">
                        <Cropper
                          image={imageToCrop}
                          crop={crop}
                          zoom={zoom}
                          aspect={3 / 1}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropComplete}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Zoom</Label>
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.1}
                          value={zoom}
                          onChange={(e) => setZoom(Number(e.target.value))}
                          className="w-full"
                          data-testid="slider-zoom"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelCrop}
                          className="flex-1"
                          data-testid="button-cancel-crop"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={handleConfirmCrop}
                          className="flex-1"
                          data-testid="button-confirm-crop"
                        >
                          <Crop className="h-4 w-4 mr-2" />
                          Recortar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ajuste o recorte para isolar apenas a sua assinatura.
                      </p>
                    </div>
                  ) : uploadedSignature ? (
                    <div className="space-y-2">
                      <div className="border-2 border-muted-foreground/30 rounded-lg bg-background p-4">
                        <img 
                          src={uploadedSignature} 
                          alt="Assinatura carregada" 
                          className="max-h-40 mx-auto object-contain"
                          data-testid="img-uploaded-signature"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveUploadedSignature}
                        className="w-full"
                        data-testid="button-remove-signature"
                      >
                        <Eraser className="h-4 w-4 mr-2" />
                        Remover e escolher outra
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Assinatura carregada com sucesso.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-40 border-2 border-dashed border-muted-foreground/30"
                        data-testid="button-upload-signature"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div className="text-center">
                            <p className="font-medium">Carregar foto da assinatura</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Tire uma foto ou selecione uma imagem
                            </p>
                          </div>
                        </div>
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Você pode tirar uma foto da sua assinatura em papel ou fazer upload de uma imagem.
                      </p>
                    </div>
                  )}
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

          <div className="p-6 pt-4 border-t">
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
                disabled={!biNumber || !uploadedSignature || signMutation.isPending}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
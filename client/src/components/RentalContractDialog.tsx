import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Property } from "@shared/schema";
import { Calendar } from "lucide-react";

const contractSchema = z.object({
  clientePhone: z.string().min(9, "Número de telefone inválido"),
  valor: z.string().min(1, "Valor da renda é obrigatório"),
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
  dataFim: z.string().min(1, "Data de fim é obrigatória"),
});

const biSchema = z.object({
  bi: z.string().min(5, "Número de BI/Passaporte inválido"),
});

type ContractFormData = z.infer<typeof contractSchema>;
type BiFormData = z.infer<typeof biSchema>;

interface RentalContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  currentUser: User;
  onSuccess: () => void;
}

export function RentalContractDialog({
  open,
  onOpenChange,
  property,
  currentUser,
  onSuccess,
}: RentalContractDialogProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showBiDialog, setShowBiDialog] = useState(false);
  const [contractData, setContractData] = useState<ContractFormData | null>(null);

  const contractForm = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      clientePhone: "",
      valor: property.price.toString(),
      dataInicio: "",
      dataFim: "",
    },
  });

  const biForm = useForm<BiFormData>({
    resolver: zodResolver(biSchema),
    defaultValues: {
      bi: "",
    },
  });

  const updateBiMutation = useMutation({
    mutationFn: async (data: BiFormData) => {
      const res = await apiRequest('PATCH', `/api/users/${currentUser.id}`, { bi: data.bi });
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "BI atualizado!",
        description: "Seu número de BI foi registrado com sucesso",
      });
      setShowBiDialog(false);
      
      if (contractData) {
        proceedWithContractCreation(contractData);
      }
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar BI",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      const res = await apiRequest('POST', '/api/contracts/create-rental', {
        propertyId: property.id,
        clientePhone: data.clientePhone,
        valor: parseFloat(data.valor),
        dataInicio: new Date(data.dataInicio).toISOString(),
        dataFim: new Date(data.dataFim).toISOString(),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Falha ao criar contrato');
      }
      
      return await res.json();
    },
    onSuccess: (contract) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser.id, 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      
      toast({
        title: "Contrato criado!",
        description: "Redirecionando para a página de assinatura...",
      });
      
      onSuccess();
      onOpenChange(false);
      contractForm.reset();
      
      // Redirect to contract signing page
      setTimeout(() => {
        setLocation(`/contratos/${contract.id}/assinar`);
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar contrato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const proceedWithContractCreation = (data: ContractFormData) => {
    createContractMutation.mutate(data);
  };

  const onSubmitContract = (data: ContractFormData) => {
    if (!currentUser.bi) {
      setContractData(data);
      setShowBiDialog(true);
      return;
    }
    
    proceedWithContractCreation(data);
  };

  const onSubmitBi = (data: BiFormData) => {
    updateBiMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Contrato de Arrendamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar o contrato de arrendamento para {property.title}
            </DialogDescription>
          </DialogHeader>

          <Form {...contractForm}>
            <form onSubmit={contractForm.handleSubmit(onSubmitContract)} className="space-y-4">
              <FormField
                control={contractForm.control}
                name="clientePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Telefone do Cliente</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+244912345678"
                        {...field}
                        data-testid="input-client-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contractForm.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Renda Mensal (Kz)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-rental-value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contractForm.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-start-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contractForm.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-end-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createContractMutation.isPending}
                  data-testid="button-cancel-contract"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createContractMutation.isPending}
                  data-testid="button-create-contract"
                >
                  {createContractMutation.isPending ? "Criando..." : "Criar Contrato"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showBiDialog} onOpenChange={setShowBiDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Número de BI/Passaporte Necessário</DialogTitle>
            <DialogDescription>
              Para criar um contrato, precisamos do seu número de Bilhete de Identidade ou Passaporte
            </DialogDescription>
          </DialogHeader>

          <Form {...biForm}>
            <form onSubmit={biForm.handleSubmit(onSubmitBi)} className="space-y-4">
              <FormField
                control={biForm.control}
                name="bi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de BI ou Passaporte</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000000000XX000"
                        {...field}
                        data-testid="input-bi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBiDialog(false)}
                  disabled={updateBiMutation.isPending}
                  data-testid="button-cancel-bi"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateBiMutation.isPending}
                  data-testid="button-submit-bi"
                >
                  {updateBiMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

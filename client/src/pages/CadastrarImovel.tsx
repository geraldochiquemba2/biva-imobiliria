import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, MapPin, DollarSign } from "lucide-react";
import type { User } from "@shared/schema";
import { z } from "zod";

const propertyFormSchema = z.object({
  title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
  description: z.string().min(20, "Descrição deve ter no mínimo 20 caracteres"),
  type: z.enum(['Arrendar', 'Vender'], {
    required_error: "Selecione o tipo de transação",
  }),
  category: z.enum(['Apartamento', 'Casa', 'Comercial', 'Terreno'], {
    required_error: "Selecione a categoria",
  }),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
  bairro: z.string().min(2, "Bairro é obrigatório"),
  municipio: z.string().min(2, "Município é obrigatório"),
  provincia: z.string().min(2, "Província é obrigatória"),
  bedrooms: z.coerce.number().min(0, "Número inválido").optional(),
  bathrooms: z.coerce.number().min(0, "Número inválido").optional(),
  area: z.coerce.number().positive("Área deve ser maior que zero"),
  image: z.string().url("URL inválida").optional().or(z.literal('')),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

export default function CadastrarImovel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [category, setCategory] = useState<string>('');

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  useEffect(() => {
    if (!userLoading && !currentUser) {
      setLocation('/login');
    } else if (!userLoading && currentUser && currentUser.userType !== 'proprietario' && currentUser.userType !== 'corretor') {
      setLocation('/dashboard');
      toast({
        title: "Acesso negado",
        description: "Apenas proprietários e corretores podem cadastrar imóveis",
        variant: "destructive",
      });
    }
  }, [currentUser, userLoading, setLocation, toast]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      bedrooms: 0,
      bathrooms: 0,
    },
  });

  const watchedCategory = watch("category");

  useEffect(() => {
    if (watchedCategory) {
      setCategory(watchedCategory);
    }
  }, [watchedCategory]);

  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const propertyData = {
        title: data.title,
        description: data.description,
        type: data.type,
        category: data.category,
        price: data.price.toString(),
        bairro: data.bairro,
        municipio: data.municipio,
        provincia: data.provincia,
        area: data.area,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        image: data.image || null,
        featured: false,
        status: 'disponivel',
        ownerId: currentUser!.id,
      };
      const res = await apiRequest('POST', '/api/properties', propertyData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Imóvel cadastrado com sucesso!",
        description: "Seu imóvel já está disponível na plataforma",
      });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar imóvel",
        description: error.message || "Ocorreu um erro ao cadastrar o imóvel",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PropertyFormData) => {
    createPropertyMutation.mutate(data);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser || (currentUser.userType !== 'proprietario' && currentUser.userType !== 'corretor')) {
    return null;
  }

  const showRoomFields = category === 'Casa' || category === 'Apartamento';

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            className="mb-6"
            asChild
            data-testid="button-back"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Cadastrar Novo Imóvel</CardTitle>
              <CardDescription>
                Preencha as informações do seu imóvel para disponibilizá-lo na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do Anúncio</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="title"
                        placeholder="Ex: Apartamento T3 em Talatona"
                        className="pl-10"
                        {...register("title")}
                        data-testid="input-title"
                      />
                    </div>
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva o imóvel, suas características e vantagens..."
                      rows={4}
                      {...register("description")}
                      data-testid="input-description"
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Transação</Label>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arrendar" data-testid="option-arrendar">Arrendar</SelectItem>
                              <SelectItem value="Vender" data-testid="option-vender">Vender</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.type && (
                        <p className="text-sm text-destructive">{errors.type.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Apartamento" data-testid="option-apartamento">Apartamento</SelectItem>
                              <SelectItem value="Casa" data-testid="option-casa">Casa</SelectItem>
                              <SelectItem value="Comercial" data-testid="option-comercial">Comercial</SelectItem>
                              <SelectItem value="Terreno" data-testid="option-terreno">Terreno</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.category && (
                        <p className="text-sm text-destructive">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (AOA)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        placeholder="350000"
                        className="pl-10"
                        {...register("price")}
                        data-testid="input-price"
                      />
                    </div>
                    {errors.price && (
                      <p className="text-sm text-destructive">{errors.price.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provincia">Província</Label>
                      <Input
                        id="provincia"
                        placeholder="Luanda"
                        {...register("provincia")}
                        data-testid="input-provincia"
                      />
                      {errors.provincia && (
                        <p className="text-sm text-destructive">{errors.provincia.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="municipio">Município</Label>
                      <Input
                        id="municipio"
                        placeholder="Belas"
                        {...register("municipio")}
                        data-testid="input-municipio"
                      />
                      {errors.municipio && (
                        <p className="text-sm text-destructive">{errors.municipio.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        placeholder="Talatona"
                        {...register("bairro")}
                        data-testid="input-bairro"
                      />
                      {errors.bairro && (
                        <p className="text-sm text-destructive">{errors.bairro.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="area">Área (m²)</Label>
                      <Input
                        id="area"
                        type="number"
                        placeholder="145"
                        {...register("area")}
                        data-testid="input-area"
                      />
                      {errors.area && (
                        <p className="text-sm text-destructive">{errors.area.message}</p>
                      )}
                    </div>

                    {showRoomFields && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="bedrooms">Quartos</Label>
                          <Input
                            id="bedrooms"
                            type="number"
                            placeholder="3"
                            {...register("bedrooms")}
                            data-testid="input-bedrooms"
                          />
                          {errors.bedrooms && (
                            <p className="text-sm text-destructive">{errors.bedrooms.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bathrooms">Casas de Banho</Label>
                          <Input
                            id="bathrooms"
                            type="number"
                            placeholder="2"
                            {...register("bathrooms")}
                            data-testid="input-bathrooms"
                          />
                          {errors.bathrooms && (
                            <p className="text-sm text-destructive">{errors.bathrooms.message}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">URL da Imagem (opcional)</Label>
                    <Input
                      id="image"
                      type="url"
                      placeholder="https://exemplo.com/imagem.jpg"
                      {...register("image")}
                      data-testid="input-image"
                    />
                    {errors.image && (
                      <p className="text-sm text-destructive">{errors.image.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    asChild
                    data-testid="button-cancel"
                  >
                    <Link href="/dashboard">Cancelar</Link>
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createPropertyMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createPropertyMutation.isPending ? "Cadastrando..." : "Cadastrar Imóvel"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

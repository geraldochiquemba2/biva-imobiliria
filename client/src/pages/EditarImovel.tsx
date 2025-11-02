import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Building2, Upload, X, Save, AlertCircle, Lock, Trash2 } from "lucide-react";
import type { User, Property } from "@shared/schema";
import { z } from "zod";
import InteractiveLocationPicker from "@/components/InteractiveLocationPicker";
import { angolaProvinces, findClosestLocation } from "@shared/angola-locations";

interface PropertyWithEditInfo extends Property {
  hasActiveVisits?: boolean;
  isRented?: boolean;
  canEdit?: boolean;
}

const AMENITIES = [
  "Piscina",
  "Academia",
  "Garagem",
  "Jardim",
  "Varanda",
  "Ar Condicionado",
  "Aquecimento",
  "Segurança 24h",
  "Elevador",
  "Churrasqueira",
];

const STATUS_OPTIONS = [
  { value: "disponivel", label: "Disponível" },
  { value: "arrendado", label: "Arrendado" },
  { value: "vendido", label: "Vendido" },
  { value: "indisponivel", label: "Indisponível" },
];

const propertySchema = z.object({
  title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
  description: z.string().min(20, "Descrição deve ter no mínimo 20 caracteres"),
  type: z.enum(["Arrendar", "Vender"]),
  category: z.enum(["Apartamento", "Casa", "Comercial", "Terreno"]),
  shortTerm: z.boolean().optional(),
  price: z.string().min(1, "Preço é obrigatório"),
  provincia: z.string().min(1, "Província é obrigatória"),
  municipio: z.string().min(1, "Município é obrigatório"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  livingRooms: z.number().min(0),
  kitchens: z.number().min(0),
  area: z.number().min(1, "Área é obrigatória"),
  latitude: z.number(),
  longitude: z.number(),
  amenities: z.array(z.string()),
  status: z.enum(["disponivel", "arrendado", "vendido", "indisponivel"]),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function EditarImovel() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/editar-imovel/:id");
  const { toast } = useToast();
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [isShortTerm, setIsShortTerm] = useState<boolean>(false);

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const { data: property, isLoading: propertyLoading } = useQuery<PropertyWithEditInfo>({
    queryKey: ['/api/properties', params?.id],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${params?.id}`);
      if (!response.ok) throw new Error('Imóvel não encontrado');
      return response.json();
    },
    enabled: !!params?.id,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      bedrooms: 0,
      bathrooms: 0,
      livingRooms: 0,
      kitchens: 0,
      amenities: [],
    },
  });

  // Populate form when property data loads
  useEffect(() => {
    if (property) {
      setValue("title", property.title);
      setValue("description", property.description || "");
      setValue("type", property.type as "Arrendar" | "Vender");
      setValue("category", property.category as any);
      setValue("price", property.price.toString());
      setValue("provincia", property.provincia);
      setValue("municipio", property.municipio);
      setValue("bairro", property.bairro);
      setValue("bedrooms", property.bedrooms);
      setValue("bathrooms", property.bathrooms);
      setValue("livingRooms", property.livingRooms);
      setValue("kitchens", property.kitchens);
      setValue("area", property.area);
      setValue("latitude", property.latitude ? parseFloat(property.latitude) : -8.8383);
      setValue("longitude", property.longitude ? parseFloat(property.longitude) : 13.2344);
      setValue("amenities", property.amenities || []);
      setValue("status", property.status as any);
      setValue("shortTerm", property.shortTerm || false);
      setIsShortTerm(property.shortTerm || false);
      setExistingImages(property.images || []);
      setSelectedProvince(property.provincia);
    }
  }, [property, setValue]);

  useEffect(() => {
    if (!userLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, userLoading, navigate]);

  const selectedAmenities = watch("amenities") || [];
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const provincia = watch("provincia");
  const municipio = watch("municipio");
  
  const availableMunicipalities = selectedProvince 
    ? angolaProvinces.find(p => p.name === selectedProvince)?.municipalities || []
    : [];


  const acknowledgeRejectionMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const res = await apiRequest('POST', `/api/properties/${propertyId}/acknowledge-rejection`);
      return await res.json();
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/properties/${id}`);
      if (!res.ok) {
        throw new Error('Falha ao eliminar imóvel');
      }
      return id;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/properties'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/properties/pending'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'all' }),
      ]);
      toast({
        title: "Imóvel eliminado!",
        description: "O imóvel foi eliminado com sucesso.",
      });
      navigate('/meus-imoveis');
    },
    onError: () => {
      toast({
        title: "Erro ao eliminar imóvel",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      // If property is rejected and not yet acknowledged, acknowledge it first
      if (property?.approvalStatus === 'recusado' && !property?.rejectionAcknowledged) {
        await acknowledgeRejectionMutation.mutateAsync(params!.id);
      }

      let finalImageUrls = [...existingImages];

      // Upload new images if any
      if (newImages.length > 0) {
        setUploadingImages(true);
        const formData = new FormData();
        newImages.forEach((file) => {
          formData.append('images', file);
        });

        const uploadRes = await apiRequest('POST', '/api/properties/upload', formData);
        const uploadData = await uploadRes.json();

        finalImageUrls = [...existingImages, ...uploadData.urls];
        setUploadingImages(false);
      }

      const propertyData = {
        title: data.title,
        description: data.description,
        type: data.type,
        category: data.category,
        shortTerm: data.shortTerm || false,
        price: data.price.toString(),
        provincia: data.provincia,
        municipio: data.municipio,
        bairro: data.bairro,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        livingRooms: data.livingRooms,
        kitchens: data.kitchens,
        area: data.area,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        amenities: data.amenities,
        status: data.status,
        images: finalImageUrls,
      };

      const res = await apiRequest('PATCH', `/api/properties/${params!.id}`, propertyData);
      return await res.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/properties'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/properties/pending'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'all' }),
      ]);
      
      const wasRejected = property?.approvalStatus === 'recusado';
      toast({
        title: wasRejected ? "Imóvel reenviado!" : "Imóvel atualizado!",
        description: wasRejected 
          ? "As alterações foram salvas e o imóvel foi reenviado para aprovação." 
          : "As alterações foram salvas com sucesso.",
      });
      navigate('/meus-imoveis');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar imóvel",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        toast({
          title: "Arquivo inválido",
          description: `${file.name} não é uma imagem válida`,
          variant: "destructive",
        });
      }
      return isValid;
    });
    
    if (validFiles.length + existingImages.length + newImages.length > 10) {
      toast({
        title: "Limite de imagens excedido",
        description: "Você pode adicionar no máximo 10 imagens",
        variant: "destructive",
      });
      return;
    }

    // Compress images
    try {
      const compressedFiles = await Promise.all(
        validFiles.map(file => compressImage(file))
      );
      
      setNewImages([...newImages, ...compressedFiles]);

      const urls = compressedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...urls]);
      
      toast({
        title: "Imagens adicionadas",
        description: `${compressedFiles.length} imagem(ns) comprimida(s) e pronta(s) para envio`,
      });
    } catch (error) {
      console.error('Erro ao comprimir imagens:', error);
      toast({
        title: "Erro ao processar imagens",
        description: "Ocorreu um erro ao comprimir as imagens. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const onSubmit = (data: PropertyFormData) => {
    if (existingImages.length === 0 && newImages.length === 0) {
      toast({
        title: "Imagens necessárias",
        description: "Adicione pelo menos uma imagem do imóvel",
        variant: "destructive",
      });
      return;
    }
    updatePropertyMutation.mutate(data);
  };

  if (userLoading || propertyLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser || !property) {
    return null;
  }

  const totalImages = existingImages.length + newImages.length;
  const isEditBlocked = property?.canEdit === false;

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            asChild
            className="mb-6"
            data-testid="button-back"
          >
            <Link href="/meus-imoveis">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Meus Imóveis
            </Link>
          </Button>

          {isEditBlocked && (
            <Alert className="mb-6" data-testid="alert-edit-blocked">
              <Lock className="h-4 w-4" />
              <AlertTitle>Edição Bloqueada</AlertTitle>
              <AlertDescription>
                {property.hasActiveVisits && property.isRented && (
                  "Este imóvel não pode ser editado pois está arrendado e possui visitas confirmadas."
                )}
                {property.hasActiveVisits && !property.isRented && (
                  "Este imóvel não pode ser editado pois possui visitas confirmadas. Cancele as visitas ou aguarde sua conclusão para poder editar."
                )}
                {!property.hasActiveVisits && property.isRented && (
                  "Este imóvel não pode ser editado pois está arrendado."
                )}
              </AlertDescription>
            </Alert>
          )}

          {property?.approvalStatus === 'recusado' && (
            <Alert variant="destructive" className="mb-6" data-testid="alert-rejected">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Imóvel Recusado</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Este imóvel foi recusado pelo administrador.</p>
                {property.rejectionMessage && (
                  <p className="font-medium">Motivo: {property.rejectionMessage}</p>
                )}
                <p className="mt-2 text-sm">
                  Faça as correções necessárias e clique em "Tentar Novamente" para reenviar o imóvel para aprovação.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Editar Imóvel
              </CardTitle>
              <CardDescription>
                Atualize as informações do seu imóvel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações Básicas</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        {...register("title")}
                        disabled={isEditBlocked}
                        data-testid="input-title"
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status *</Label>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange} disabled={isEditBlocked}>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      {...register("description")}
                      disabled={isEditBlocked}
                      data-testid="input-description"
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo *</Label>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange} disabled={isEditBlocked}>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arrendar">Arrendar</SelectItem>
                              <SelectItem value="Vender">Vender</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria *</Label>
                      <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange} disabled={isEditBlocked}>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Apartamento">Apartamento</SelectItem>
                              <SelectItem value="Casa">Casa</SelectItem>
                              <SelectItem value="Comercial">Comercial</SelectItem>
                              <SelectItem value="Terreno">Terreno</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (Kz) *</Label>
                      <Input
                        id="price"
                        type="number"
                        {...register("price")}
                        disabled={isEditBlocked}
                        data-testid="input-price"
                      />
                      {errors.price && (
                        <p className="text-sm text-destructive">{errors.price.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="shortTerm"
                        checked={isShortTerm}
                        onCheckedChange={(checked) => {
                          setIsShortTerm(checked as boolean);
                          setValue("shortTerm", checked as boolean);
                        }}
                        disabled={isEditBlocked}
                        data-testid="checkbox-short-term"
                      />
                      <label
                        htmlFor="shortTerm"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Imóvel de Curta Duração
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Marque esta opção se o imóvel é para arrendamento de curta duração (hospedagem temporária, férias, etc.). Imóveis de curta duração não permitem contratos formais.
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Localização</h3>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provincia">Província *</Label>
                      <Controller
                        name="provincia"
                        control={control}
                        render={({ field }) => (
                          <Select 
                            value={field.value} 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedProvince(value);
                              setValue("municipio", "");
                              
                              const province = angolaProvinces.find(p => p.name === value);
                              if (province?.coordinates) {
                                setValue("latitude", province.coordinates.lat);
                                setValue("longitude", province.coordinates.lng);
                              }
                            }}
                            disabled={isEditBlocked}
                          >
                            <SelectTrigger data-testid="select-provincia">
                              <SelectValue placeholder="Selecione a província" />
                            </SelectTrigger>
                            <SelectContent>
                              {angolaProvinces.map((province) => (
                                <SelectItem key={province.name} value={province.name}>
                                  {province.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.provincia && (
                        <p className="text-sm text-destructive">{errors.provincia.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="municipio">Município *</Label>
                      <Controller
                        name="municipio"
                        control={control}
                        render={({ field }) => (
                          <Select 
                            value={field.value} 
                            onValueChange={(value) => {
                              field.onChange(value);
                              
                              const province = angolaProvinces.find(p => p.name === selectedProvince);
                              const municipality = province?.municipalities.find(m => m.name === value);
                              if (municipality?.coordinates) {
                                setValue("latitude", municipality.coordinates.lat);
                                setValue("longitude", municipality.coordinates.lng);
                              }
                            }}
                            disabled={isEditBlocked || !selectedProvince}
                          >
                            <SelectTrigger data-testid="select-municipio">
                              <SelectValue placeholder={selectedProvince ? "Selecione o município" : "Primeiro selecione a província"} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableMunicipalities.map((municipality) => (
                                <SelectItem key={municipality.name} value={municipality.name}>
                                  {municipality.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.municipio && (
                        <p className="text-sm text-destructive">{errors.municipio.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro *</Label>
                      <Input
                        id="bairro"
                        {...register("bairro")}
                        disabled={isEditBlocked}
                        data-testid="input-bairro"
                      />
                      {errors.bairro && (
                        <p className="text-sm text-destructive">{errors.bairro.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Localização no Mapa</Label>
                    <InteractiveLocationPicker
                      latitude={latitude}
                      longitude={longitude}
                      onLocationChange={(lat, lng) => {
                        setValue("latitude", lat);
                        setValue("longitude", lng);
                      }}
                      onLocationSelect={(provincia, municipio) => {
                        setValue("provincia", provincia);
                        setSelectedProvince(provincia);
                        setValue("municipio", municipio);
                      }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Detalhes do Imóvel</h3>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Quartos</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        min="0"
                        {...register("bedrooms", { valueAsNumber: true })}
                        disabled={isEditBlocked}
                        data-testid="input-bedrooms"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Casas de Banho</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        min="0"
                        {...register("bathrooms", { valueAsNumber: true })}
                        disabled={isEditBlocked}
                        data-testid="input-bathrooms"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="livingRooms">Salas</Label>
                      <Input
                        id="livingRooms"
                        type="number"
                        min="0"
                        {...register("livingRooms", { valueAsNumber: true })}
                        disabled={isEditBlocked}
                        data-testid="input-livingrooms"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kitchens">Cozinhas</Label>
                      <Input
                        id="kitchens"
                        type="number"
                        min="0"
                        {...register("kitchens", { valueAsNumber: true })}
                        disabled={isEditBlocked}
                        data-testid="input-kitchens"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area">Área (m²) *</Label>
                      <Input
                        id="area"
                        type="number"
                        min="1"
                        {...register("area", { valueAsNumber: true })}
                        disabled={isEditBlocked}
                        data-testid="input-area"
                      />
                      {errors.area && (
                        <p className="text-sm text-destructive">{errors.area.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Comodidades</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AMENITIES.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Controller
                          name="amenities"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value?.includes(amenity)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                field.onChange(
                                  checked
                                    ? [...current, amenity]
                                    : current.filter((a) => a !== amenity)
                                );
                              }}
                              disabled={isEditBlocked}
                              data-testid={`checkbox-${amenity.toLowerCase().replace(/\s+/g, '-')}`}
                            />
                          )}
                        />
                        <Label className="text-sm">{amenity}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Imagens ({totalImages}/10)</h3>
                  <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                    <span>✓</span>
                    <span>Suas imagens são armazenadas de forma segura e permanente no banco de dados PostgreSQL (Neon).</span>
                  </p>

                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Imagens atuais</p>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {existingImages.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Imagem ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              disabled={isEditBlocked}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                              data-testid={`button-remove-existing-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Images */}
                  {previewUrls.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Novas imagens</p>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Nova imagem ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeNewImage(index)}
                              disabled={isEditBlocked}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                              data-testid={`button-remove-new-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {totalImages < 10 && !isEditBlocked && (
                    <div>
                      <Label
                        htmlFor="images"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-md hover-elevate"
                      >
                        <Upload className="h-4 w-4" />
                        Adicionar Mais Imagens
                      </Label>
                      <input
                        type="file"
                        id="images"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        data-testid="input-images"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  {property?.approvalStatus === 'recusado' ? (
                    <>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isEditBlocked || updatePropertyMutation.isPending || uploadingImages}
                        className="flex-1"
                        data-testid="button-resubmit"
                      >
                        <Save className="h-5 w-5 mr-2" />
                        {updatePropertyMutation.isPending || uploadingImages ? "Reenviando..." : "Tentar Novamente"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="lg"
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja eliminar este imóvel? Esta ação não pode ser desfeita.')) {
                            deletePropertyMutation.mutate(params!.id);
                          }
                        }}
                        disabled={deletePropertyMutation.isPending}
                        data-testid="button-delete"
                      >
                        <Trash2 className="h-5 w-5 mr-2" />
                        {deletePropertyMutation.isPending ? "Eliminando..." : "Eliminar"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isEditBlocked || updatePropertyMutation.isPending || uploadingImages}
                        className="flex-1"
                        data-testid="button-save"
                      >
                        <Save className="h-5 w-5 mr-2" />
                        {updatePropertyMutation.isPending || uploadingImages ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        asChild
                        data-testid="button-cancel"
                      >
                        <Link href="/meus-imoveis">Cancelar</Link>
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
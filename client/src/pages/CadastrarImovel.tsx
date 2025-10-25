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
import { ArrowLeft, Building2, DollarSign, Upload, X, Star } from "lucide-react";
import type { User } from "@shared/schema";
import { z } from "zod";

// Províncias e Municípios de Angola
const PROVINCIAS_MUNICIPIOS: Record<string, string[]> = {
  "Luanda": ["Luanda", "Belas", "Cacuaco", "Cazenga", "Icolo e Bengo", "Quiçama", "Viana"],
  "Bengo": ["Ambriz", "Bula Atumba", "Dande", "Dembos", "Nambuangongo", "Pango Aluquém"],
  "Benguela": ["Benguela", "Baía Farta", "Balombo", "Bocoio", "Caimbambo", "Catumbela", "Chongorói", "Cubal", "Ganda", "Lobito"],
  "Bié": ["Kuito", "Andulo", "Camacupa", "Catabola", "Chinguar", "Chitembo", "Cuemba", "Cunhinga", "Nharea"],
  "Cabinda": ["Cabinda", "Belize", "Buco-Zau", "Cacongo"],
  "Cuando Cubango": ["Menongue", "Calai", "Cuangar", "Cuchi", "Cuito Cuanavale", "Dirico", "Mavinga", "Nankova", "Rivungo"],
  "Cuanza Norte": ["N'dalatando", "Ambaca", "Banga", "Bolongongo", "Cambambe", "Cazengo", "Golungo Alto", "Gonguembo", "Lucala", "Quiculungo", "Samba Caju"],
  "Cuanza Sul": ["Sumbe", "Amboim", "Cassongue", "Cela", "Conda", "Ebo", "Libolo", "Mussende", "Porto Amboim", "Quibala", "Quilenda", "Seles"],
  "Cunene": ["Ondjiva", "Cahama", "Cuanhama", "Curoca", "Cuvelai", "Namacunde", "Ombadja"],
  "Huambo": ["Huambo", "Bailundo", "Cachiungo", "Caála", "Ekunha", "Chinjenje", "Chipindo", "Chicala-Choloanga", "Chiumbo", "Londuimbali", "Longonjo", "Mungo", "Ucuma"],
  "Huíla": ["Lubango", "Caconda", "Cacula", "Caluquembe", "Chiange", "Chibia", "Chicomba", "Chipindo", "Cuvango", "Humpata", "Jamba", "Matala", "Quilengues", "Quipungo"],
  "Lunda Norte": ["Dundo", "Cambulo", "Capenda-Camulemba", "Caungula", "Chitato", "Cuango", "Cuílo", "Lóvua", "Lubalo", "Lucapa"],
  "Lunda Sul": ["Saurimo", "Cacolo", "Dala", "Muconda"],
  "Malanje": ["Malanje", "Cacuso", "Calandula", "Cambundi-Catembo", "Cangandala", "Caombo", "Cuaba Nzogo", "Cunda-Dia-Baze", "Quirima", "Luquembo", "Massango", "Marimba", "Mucari", "Quela"],
  "Moxico": ["Luena", "Alto Zambeze", "Bundas", "Camanongue", "Cameia", "Leua", "Luacano", "Luchazes", "Lumeje", "Moxico"],
  "Namibe": ["Moçâmedes", "Bibala", "Camucuio", "Tômbua", "Virei"],
  "Uíge": ["Uíge", "Alto Cauale", "Ambuíla", "Bembe", "Buengas", "Bungo", "Damba", "Macocola", "Milunga", "Mucaba", "Negage", "Puri", "Quimbele", "Quitexe", "Sanza Pombo", "Songo"],
  "Zaire": ["M'banza Kongo", "Cuimba", "Nóqui", "Nzeto", "Soio", "Tomboco"]
};

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
  livingRooms: z.coerce.number().min(0, "Número inválido").optional(),
  kitchens: z.coerce.number().min(0, "Número inválido").optional(),
  area: z.coerce.number().positive("Área deve ser maior que zero"),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

export default function CadastrarImovel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [category, setCategory] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

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
    setValue,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      bedrooms: 0,
      bathrooms: 0,
      livingRooms: 0,
      kitchens: 0,
    },
  });

  const watchedCategory = watch("category");
  const watchedProvince = watch("provincia");

  useEffect(() => {
    if (watchedCategory) {
      setCategory(watchedCategory);
    }
  }, [watchedCategory]);

  useEffect(() => {
    if (watchedProvince && watchedProvince !== selectedProvince) {
      setSelectedProvince(watchedProvince);
      setValue("municipio", "");
    }
  }, [watchedProvince, selectedProvince, setValue]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate file sizes
    const validSizedFiles = validFiles.filter(file => {
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5 MB
      if (!isValidSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o tamanho máximo de 5 MB`,
          variant: "destructive",
        });
      }
      return isValidSize;
    });

    // Limit to 10 files
    const totalFiles = selectedFiles.length + validSizedFiles.length;
    if (totalFiles > 10) {
      toast({
        title: "Limite de arquivos",
        description: "Você pode enviar no máximo 10 imagens",
        variant: "destructive",
      });
      return;
    }

    // Create preview URLs
    const newPreviewUrls = validSizedFiles.map(file => URL.createObjectURL(file));
    
    setSelectedFiles([...selectedFiles, ...validSizedFiles]);
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    
    // Adjust cover image index if necessary
    if (coverImageIndex === index) {
      setCoverImageIndex(0);
    } else if (coverImageIndex > index) {
      setCoverImageIndex(coverImageIndex - 1);
    }
  };

  const setCoverImage = (index: number) => {
    setCoverImageIndex(index);
  };

  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      setIsUploading(true);
      
      let imageUrls: string[] = [];
      
      // Upload images first if any were selected
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        
        // Reorder files so cover image is first
        const reorderedFiles = [...selectedFiles];
        if (coverImageIndex > 0) {
          const coverFile = reorderedFiles[coverImageIndex];
          reorderedFiles.splice(coverImageIndex, 1);
          reorderedFiles.unshift(coverFile);
        }
        
        reorderedFiles.forEach(file => {
          formData.append('images', file);
        });

        try {
          const uploadRes = await fetch('/api/properties/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          
          if (!uploadRes.ok) {
            throw new Error('Upload failed');
          }
          
          const uploadData = await uploadRes.json();
          
          if (uploadData.success && uploadData.urls) {
            imageUrls = uploadData.urls;
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Falha ao fazer upload das imagens');
        }
      }
      
      const propertyData: any = {
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
        livingRooms: data.livingRooms || 0,
        kitchens: data.kitchens || 0,
        featured: false,
        status: 'disponivel',
        ownerId: currentUser!.id,
      };
      
      if (imageUrls.length > 0) {
        propertyData.images = imageUrls;
      }
      
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
    onSettled: () => {
      setIsUploading(false);
    }
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
  const availableMunicipios = selectedProvince ? PROVINCIAS_MUNICIPIOS[selectedProvince] || [] : [];

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
                      <Controller
                        name="provincia"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-provincia">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(PROVINCIAS_MUNICIPIOS).sort().map((provincia) => (
                                <SelectItem key={provincia} value={provincia} data-testid={`option-provincia-${provincia.toLowerCase().replace(/\s+/g, '-')}`}>
                                  {provincia}
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
                      <Label htmlFor="municipio">Município</Label>
                      <Controller
                        name="municipio"
                        control={control}
                        render={({ field }) => (
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={!selectedProvince}
                          >
                            <SelectTrigger data-testid="select-municipio">
                              <SelectValue placeholder={selectedProvince ? "Selecione" : "Selecione província primeiro"} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableMunicipios.map((municipio) => (
                                <SelectItem key={municipio} value={municipio} data-testid={`option-municipio-${municipio.toLowerCase().replace(/\s+/g, '-')}`}>
                                  {municipio}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

                  {showRoomFields && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <Label htmlFor="livingRooms">Salas</Label>
                        <Input
                          id="livingRooms"
                          type="number"
                          placeholder="1"
                          {...register("livingRooms")}
                          data-testid="input-livingrooms"
                        />
                        {errors.livingRooms && (
                          <p className="text-sm text-destructive">{errors.livingRooms.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="kitchens">Cozinhas</Label>
                        <Input
                          id="kitchens"
                          type="number"
                          placeholder="1"
                          {...register("kitchens")}
                          data-testid="input-kitchens"
                        />
                        {errors.kitchens && (
                          <p className="text-sm text-destructive">{errors.kitchens.message}</p>
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
                    </div>
                  )}

                  {/* Image upload section */}
                  <div className="space-y-4">
                    <div>
                      <Label>Imagens do Imóvel (até 10)</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        A primeira imagem será a capa do anúncio. Clique na estrela para mudar a capa.
                      </p>
                    </div>
                    
                    {previewUrls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={url} 
                              alt={`Preview ${index + 1}`}
                              className={`w-full h-32 object-cover rounded-md border-2 ${
                                coverImageIndex === index ? 'border-primary' : 'border-border'
                              }`}
                            />
                            <Button
                              type="button"
                              variant={coverImageIndex === index ? "default" : "secondary"}
                              size="icon"
                              className="absolute top-2 left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setCoverImage(index)}
                              data-testid={`button-set-cover-${index}`}
                            >
                              <Star className={`h-3 w-3 ${coverImageIndex === index ? 'fill-current' : ''}`} />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFile(index)}
                              data-testid={`button-remove-image-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            {coverImageIndex === index && (
                              <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                Capa
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedFiles.length < 10 && (
                      <div>
                        <Label 
                          htmlFor="images" 
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover-elevate"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Clique para selecionar imagens
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              JPEG, PNG ou WebP (máx. 5 MB cada)
                            </p>
                          </div>
                        </Label>
                        <Input
                          id="images"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                          data-testid="input-images"
                        />
                      </div>
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
                    disabled={createPropertyMutation.isPending || isUploading}
                    data-testid="button-submit"
                  >
                    {isUploading ? "Enviando imagens..." : createPropertyMutation.isPending ? "Cadastrando..." : "Cadastrar Imóvel"}
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

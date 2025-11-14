import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
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
import { ArrowLeft, Building2, DollarSign, Upload, X, Star } from "lucide-react";
import type { User } from "@shared/schema";
import { z } from "zod";
import backgroundImage from "@assets/stock_images/luxury_modern_apartm_d0631b09.jpg";
import InteractiveLocationPicker from "@/components/InteractiveLocationPicker";

// Províncias e Municípios de Angola
const PROVINCIAS_MUNICIPIOS: Record<string, string[]> = {
  "Luanda": ["Luanda", "Belas", "Cacuaco", "Cazenga", "Icolo e Bengo", "Kilamba Kiaxi", "Quiçama", "Talatona", "Viana"],
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

// Coordenadas aproximadas das províncias e principais municípios de Angola
const LOCATION_COORDINATES: Record<string, { lat: number; lon: number }> = {
  // Províncias
  "Luanda": { lat: -8.8383, lon: 13.2344 },
  "Bengo": { lat: -9.0667, lon: 13.7500 },
  "Benguela": { lat: -12.5763, lon: 13.4055 },
  "Bié": { lat: -12.3889, lon: 17.5500 },
  "Cabinda": { lat: -5.5550, lon: 12.2000 },
  "Cuando Cubango": { lat: -14.6667, lon: 17.7333 },
  "Cuanza Norte": { lat: -9.3044, lon: 14.9111 },
  "Cuanza Sul": { lat: -11.2058, lon: 14.9147 },
  "Cunene": { lat: -16.6667, lon: 16.2500 },
  "Huambo": { lat: -12.7760, lon: 15.7390 },
  "Huíla": { lat: -14.9167, lon: 13.4833 },
  "Lunda Norte": { lat: -7.3667, lon: 20.8333 },
  "Lunda Sul": { lat: -9.6667, lon: 20.3833 },
  "Malanje": { lat: -9.5402, lon: 16.3410 },
  "Moxico": { lat: -11.7881, lon: 19.9069 },
  "Namibe": { lat: -15.1961, lon: 12.1522 },
  "Uíge": { lat: -7.6073, lon: 15.0611 },
  "Zaire": { lat: -6.2658, lon: 14.2450 },
  
  // Municípios de Luanda
  "Belas": { lat: -9.0500, lon: 13.1500 },
  "Cacuaco": { lat: -8.7833, lon: 13.3667 },
  "Cazenga": { lat: -8.8500, lon: 13.2800 },
  "Icolo e Bengo": { lat: -9.0667, lon: 13.5000 },
  "Kilamba Kiaxi": { lat: -8.8800, lon: 13.2500 },
  "Quiçama": { lat: -9.6833, lon: 13.6167 },
  "Talatona": { lat: -8.9167, lon: 13.1667 },
  "Viana": { lat: -8.8889, lon: 13.3767 },
  
  // Municípios de Bengo
  "Ambriz": { lat: -7.8667, lon: 13.1167 },
  "Bula Atumba": { lat: -8.9167, lon: 13.9167 },
  "Dande": { lat: -8.8000, lon: 13.4833 },
  "Dembos": { lat: -9.1833, lon: 13.9833 },
  "Nambuangongo": { lat: -9.0500, lon: 14.3167 },
  "Pango Aluquém": { lat: -8.7000, lon: 13.8167 },
  
  // Municípios de Benguela
  "Balombo": { lat: -12.3500, lon: 14.6833 },
  "Baía Farta": { lat: -12.4833, lon: 13.1667 },
  "Bocoio": { lat: -12.6000, lon: 14.1833 },
  "Caimbambo": { lat: -12.2833, lon: 13.9167 },
  "Catumbela": { lat: -12.4333, lon: 13.5500 },
  "Chongorói": { lat: -12.5500, lon: 14.0833 },
  "Cubal": { lat: -13.0000, lon: 14.2500 },
  "Ganda": { lat: -13.2500, lon: 14.5833 },
  "Lobito": { lat: -12.3644, lon: 13.5487 },
  
  // Municípios de Bié
  "Kuito": { lat: -12.3833, lon: 16.9333 },
  "Andulo": { lat: -11.4833, lon: 16.7167 },
  "Camacupa": { lat: -12.0167, lon: 17.4833 },
  "Catabola": { lat: -12.7500, lon: 17.2833 },
  "Chinguar": { lat: -12.6333, lon: 16.5167 },
  "Chitembo": { lat: -13.0167, lon: 16.9667 },
  "Cuemba": { lat: -12.6667, lon: 16.8000 },
  "Cunhinga": { lat: -11.8833, lon: 16.9333 },
  "Nharea": { lat: -12.9167, lon: 17.5000 },
  
  // Municípios de Cabinda
  "Belize": { lat: -5.5167, lon: 12.5000 },
  "Buco-Zau": { lat: -5.1667, lon: 12.6167 },
  "Cacongo": { lat: -5.0833, lon: 12.3833 },
  
  // Municípios de Cuando Cubango
  "Menongue": { lat: -14.6667, lon: 17.7333 },
  "Calai": { lat: -13.5000, lon: 20.3167 },
  "Cuangar": { lat: -15.0500, lon: 20.5333 },
  "Cuchi": { lat: -14.1000, lon: 18.5833 },
  "Cuito Cuanavale": { lat: -15.1667, lon: 19.1833 },
  "Dirico": { lat: -17.7833, lon: 20.7833 },
  "Mavinga": { lat: -15.7833, lon: 20.4000 },
  "Nankova": { lat: -13.7667, lon: 18.8667 },
  "Rivungo": { lat: -14.3167, lon: 21.6667 },
  
  // Municípios de Cuanza Norte
  "N'dalatando": { lat: -9.2978, lon: 14.9116 },
  "Ambaca": { lat: -9.3667, lon: 15.1833 },
  "Banga": { lat: -9.0333, lon: 15.2000 },
  "Bolongongo": { lat: -9.1833, lon: 14.6833 },
  "Cambambe": { lat: -9.8167, lon: 15.3667 },
  "Cazengo": { lat: -9.6333, lon: 14.5833 },
  "Golungo Alto": { lat: -9.1167, lon: 14.4667 },
  "Gonguembo": { lat: -9.4833, lon: 15.5167 },
  "Lucala": { lat: -9.5333, lon: 14.9167 },
  "Quiculungo": { lat: -9.7167, lon: 15.0833 },
  "Samba Caju": { lat: -9.8667, lon: 15.8167 },
  
  // Municípios de Cuanza Sul
  "Sumbe": { lat: -11.2058, lon: 13.8433 },
  "Amboim": { lat: -10.7333, lon: 14.8500 },
  "Cassongue": { lat: -11.9167, lon: 14.4167 },
  "Cela": { lat: -11.5167, lon: 15.3000 },
  "Conda": { lat: -12.2000, lon: 15.5667 },
  "Ebo": { lat: -11.1333, lon: 14.4667 },
  "Libolo": { lat: -10.1833, lon: 14.5833 },
  "Mussende": { lat: -10.8500, lon: 15.2167 },
  "Porto Amboim": { lat: -10.7167, lon: 13.7833 },
  "Quibala": { lat: -10.7333, lon: 14.9833 },
  "Quilenda": { lat: -10.9667, lon: 14.6667 },
  "Seles": { lat: -11.9333, lon: 14.9833 },
  
  // Municípios de Cunene
  "Ondjiva": { lat: -17.0667, lon: 15.7333 },
  "Cahama": { lat: -16.3167, lon: 14.2500 },
  "Cuanhama": { lat: -17.3500, lon: 16.0167 },
  "Curoca": { lat: -16.7667, lon: 15.5667 },
  "Cuvelai": { lat: -17.3833, lon: 15.8333 },
  "Namacunde": { lat: -17.4167, lon: 16.6667 },
  "Ombadja": { lat: -17.2833, lon: 15.4667 },
  
  // Municípios de Huambo
  "Bailundo": { lat: -12.1667, lon: 15.3167 },
  "Cachiungo": { lat: -12.3833, lon: 16.2333 },
  "Caála": { lat: -12.8500, lon: 15.5667 },
  "Ekunha": { lat: -12.3500, lon: 15.6833 },
  "Chinjenje": { lat: -12.5833, lon: 15.4500 },
  "Chipindo": { lat: -12.6333, lon: 15.8667 },
  "Chicala-Choloanga": { lat: -12.9833, lon: 15.2667 },
  "Chiumbo": { lat: -12.5333, lon: 16.1833 },
  "Londuimbali": { lat: -13.1000, lon: 15.5833 },
  "Longonjo": { lat: -12.9000, lon: 15.2500 },
  "Mungo": { lat: -12.7167, lon: 15.9333 },
  "Ucuma": { lat: -12.5500, lon: 15.2833 },
  
  // Municípios de Huíla
  "Lubango": { lat: -14.9167, lon: 13.4925 },
  "Caconda": { lat: -13.7333, lon: 15.0667 },
  "Cacula": { lat: -14.0667, lon: 14.0000 },
  "Caluquembe": { lat: -13.9333, lon: 15.0167 },
  "Chiange": { lat: -14.0500, lon: 13.6167 },
  "Chibia": { lat: -15.1833, lon: 13.8667 },
  "Chicomba": { lat: -12.4667, lon: 14.9000 },
  "Cuvango": { lat: -14.4833, lon: 16.8833 },
  "Humpata": { lat: -15.0500, lon: 13.3833 },
  "Jamba": { lat: -14.7500, lon: 16.1500 },
  "Matala": { lat: -15.0167, lon: 14.0167 },
  "Quilengues": { lat: -13.6500, lon: 14.0500 },
  "Quipungo": { lat: -14.8167, lon: 14.5667 },
  
  // Municípios de Lunda Norte
  "Dundo": { lat: -7.3667, lon: 20.8333 },
  "Cambulo": { lat: -7.8833, lon: 20.5000 },
  "Capenda-Camulemba": { lat: -9.4333, lon: 18.4333 },
  "Caungula": { lat: -8.6833, lon: 19.3167 },
  "Chitato": { lat: -7.3833, lon: 20.2833 },
  "Cuango": { lat: -8.5833, lon: 18.7500 },
  "Cuílo": { lat: -7.7667, lon: 19.4167 },
  "Lóvua": { lat: -7.1500, lon: 21.4667 },
  "Lubalo": { lat: -8.5667, lon: 20.9333 },
  "Lucapa": { lat: -8.4167, lon: 20.7500 },
  
  // Municípios de Lunda Sul
  "Saurimo": { lat: -9.6667, lon: 20.3833 },
  "Cacolo": { lat: -9.0667, lon: 19.4500 },
  "Dala": { lat: -10.3500, lon: 21.5333 },
  "Muconda": { lat: -10.3333, lon: 20.9000 },
  
  // Municípios de Malanje
  "Cacuso": { lat: -9.7500, lon: 15.0833 },
  "Calandula": { lat: -9.2167, lon: 15.8833 },
  "Cambundi-Catembo": { lat: -8.1667, lon: 15.5000 },
  "Cangandala": { lat: -9.7833, lon: 16.7667 },
  "Caombo": { lat: -9.4000, lon: 16.9500 },
  "Cuaba Nzogo": { lat: -9.1833, lon: 15.6333 },
  "Cunda-Dia-Baze": { lat: -9.9667, lon: 15.6500 },
  "Quirima": { lat: -9.3333, lon: 16.4833 },
  "Luquembo": { lat: -9.2667, lon: 16.7333 },
  "Massango": { lat: -9.9833, lon: 16.1833 },
  "Marimba": { lat: -9.1833, lon: 16.1667 },
  "Mucari": { lat: -10.3167, lon: 16.5333 },
  "Quela": { lat: -10.1833, lon: 16.7667 },
  
  // Municípios de Moxico
  "Luena": { lat: -11.7881, lon: 19.9069 },
  "Alto Zambeze": { lat: -12.7500, lon: 22.6167 },
  "Bundas": { lat: -11.3000, lon: 19.3167 },
  "Camanongue": { lat: -13.4833, lon: 21.3000 },
  "Cameia": { lat: -11.8667, lon: 20.8667 },
  "Leua": { lat: -11.3667, lon: 20.3667 },
  "Luacano": { lat: -12.3333, lon: 20.6167 },
  "Luchazes": { lat: -13.5833, lon: 20.3500 },
  "Lumeje": { lat: -11.6000, lon: 22.0667 },
  
  // Municípios de Namibe
  "Moçâmedes": { lat: -15.1961, lon: 12.1522 },
  "Bibala": { lat: -14.9000, lon: 13.6667 },
  "Camucuio": { lat: -15.2667, lon: 12.8333 },
  "Tômbua": { lat: -15.7833, lon: 11.8833 },
  "Virei": { lat: -15.8667, lon: 13.5667 },
  
  // Municípios de Uíge
  "Alto Cauale": { lat: -7.0833, lon: 15.6333 },
  "Ambuíla": { lat: -7.3000, lon: 15.2833 },
  "Bembe": { lat: -7.1000, lon: 15.9333 },
  "Buengas": { lat: -7.4500, lon: 15.5167 },
  "Bungo": { lat: -8.0333, lon: 15.7667 },
  "Damba": { lat: -7.6500, lon: 14.9500 },
  "Macocola": { lat: -6.8000, lon: 15.2500 },
  "Milunga": { lat: -7.9167, lon: 15.4667 },
  "Mucaba": { lat: -7.2500, lon: 15.4167 },
  "Negage": { lat: -7.7667, lon: 15.2833 },
  "Puri": { lat: -7.3667, lon: 14.7833 },
  "Quimbele": { lat: -8.2833, lon: 15.7333 },
  "Quitexe": { lat: -7.9333, lon: 16.2833 },
  "Sanza Pombo": { lat: -6.8667, lon: 15.8667 },
  "Songo": { lat: -8.0667, lon: 14.9333 },
  
  // Municípios de Zaire
  "M'banza Kongo": { lat: -6.2658, lon: 14.2450 },
  "Cuimba": { lat: -6.0167, lon: 14.4833 },
  "Nóqui": { lat: -5.8333, lon: 12.5167 },
  "Nzeto": { lat: -7.2333, lon: 12.8667 },
  "Soio": { lat: -6.1333, lon: 12.3667 },
  "Tomboco": { lat: -6.4667, lon: 14.2167 },
};

// Comodidades disponíveis
const AVAILABLE_AMENITIES = [
  "Ar Condicionado",
  "Aquecimento",
  "Piscina",
  "Ginásio",
  "Jardim",
  "Varanda",
  "Terraço",
  "Garagem",
  "Parqueamento",
  "Segurança 24h",
  "Portão Eletrônico",
  "Elevador",
  "Gerador",
  "Sistema Solar",
  "Internet/Wi-Fi",
  "TV por Cabo",
  "Área de Lazer",
  "Churrasqueira",
  "Despensa",
  "Armários Embutidos",
];

const propertyFormSchema = z.object({
  title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
  description: z.string().min(20, "Descrição deve ter no mínimo 20 caracteres"),
  type: z.enum(['Arrendar', 'Vender'], {
    required_error: "Selecione o tipo de transação",
  }),
  category: z.enum(['Apartamento', 'Casa', 'Comercial', 'Terreno', 'Coworking'], {
    required_error: "Selecione a categoria",
  }),
  shortTerm: z.boolean().optional(),
  price: z.coerce.number().optional(),
  pricePerHour: z.coerce.number().optional(),
  bairro: z.string().min(2, "Bairro é obrigatório"),
  municipio: z.string().min(2, "Município é obrigatório"),
  provincia: z.string().min(2, "Província é obrigatória"),
  bedrooms: z.coerce.number().min(0, "Número inválido").optional(),
  bathrooms: z.coerce.number().min(0, "Número inválido").optional(),
  livingRooms: z.coerce.number().min(0, "Número inválido").optional(),
  kitchens: z.coerce.number().min(0, "Número inválido").optional(),
  area: z.coerce.number().positive("Área deve ser maior que zero"),
  amenities: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.category === 'Coworking') {
    if (!data.pricePerHour || data.pricePerHour <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Preço por hora é obrigatório para Coworking",
        path: ['pricePerHour'],
      });
    }
  } else {
    if (!data.price || data.price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Preço deve ser maior que zero",
        path: ['price'],
      });
    }
  }
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
  const [mapLatitude, setMapLatitude] = useState<number>(-8.8383);
  const [mapLongitude, setMapLongitude] = useState<number>(13.2344);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [formattedPrice, setFormattedPrice] = useState<string>('');

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  useEffect(() => {
    if (!userLoading && !currentUser) {
      setLocation('/login');
    } else if (!userLoading && currentUser) {
      const hasAccess = currentUser.userTypes?.includes('proprietario') || currentUser.userTypes?.includes('corretor');
      if (!hasAccess) {
        setLocation('/dashboard');
        toast({
          title: "Acesso negado",
          description: "Apenas proprietários e corretores podem cadastrar imóveis",
          variant: "destructive",
        });
      }
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
      bedrooms: undefined,
      bathrooms: undefined,
      livingRooms: undefined,
      kitchens: undefined,
    },
  });

  const watchedCategory = watch("category");
  const watchedProvince = watch("provincia");
  const selectedMunicipio = watch("municipio");
  const bairro = watch("bairro");
  const watchedShortTerm = watch("shortTerm");

  useEffect(() => {
    if (watchedCategory) {
      setCategory(watchedCategory);
      if (watchedCategory === 'Coworking') {
        setValue('shortTerm', false);
        setValue('price', undefined);
        setFormattedPrice('');
      } else {
        setValue('pricePerHour', undefined);
      }
    }
  }, [watchedCategory, setValue]);

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

  // Get coordinates for the current location (excluding bairro)
  const getCoordinates = () => {
    // Priority: municipio > provincia (bairro is NOT included)
    if (selectedMunicipio && LOCATION_COORDINATES[selectedMunicipio]) {
      return LOCATION_COORDINATES[selectedMunicipio];
    }
    if (selectedProvince && LOCATION_COORDINATES[selectedProvince]) {
      return LOCATION_COORDINATES[selectedProvince];
    }
    // Default to Luanda
    return { lat: -8.8383, lon: 13.2344 };
  };

  // Update map coordinates when província or município changes (but NOT bairro)
  useEffect(() => {
    const coords = getCoordinates();
    setMapLatitude(coords.lat);
    setMapLongitude(coords.lon);
  }, [selectedProvince, selectedMunicipio]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate file sizes (before compression)
    const validSizedFiles = validFiles.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10 MB (antes da compressão)
      if (!isValidSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o tamanho máximo de 10 MB`,
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

    // Compress images
    try {
      const compressedFiles = await Promise.all(
        validSizedFiles.map(file => compressImage(file))
      );
      
      // Create preview URLs from compressed files
      const newPreviewUrls = compressedFiles.map(file => URL.createObjectURL(file));
      
      setSelectedFiles([...selectedFiles, ...compressedFiles]);
      setPreviewUrls([...previewUrls, ...newPreviewUrls]);
      
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

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const formatPriceInput = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    
    const number = parseInt(numericValue, 10);
    return number.toLocaleString('pt-AO').replace(/,/g, ' ');
  };

  const handlePriceChange = (value: string, onChange: (value: number) => void) => {
    const formatted = formatPriceInput(value);
    setFormattedPrice(formatted);
    
    const numericValue = value.replace(/\D/g, '');
    if (numericValue) {
      onChange(parseInt(numericValue, 10));
    } else {
      onChange(0);
    }
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
        shortTerm: data.shortTerm || false,
        bairro: data.bairro,
        municipio: data.municipio,
        provincia: data.provincia,
        area: data.area,
        latitude: mapLatitude.toString(),
        longitude: mapLongitude.toString(),
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        livingRooms: data.livingRooms || 0,
        kitchens: data.kitchens || 0,
        featured: false,
        status: 'disponivel',
        ownerId: currentUser!.id,
      };
      
      if (data.category === 'Coworking') {
        if (data.pricePerHour !== undefined) {
          propertyData.pricePerHour = data.pricePerHour.toString();
        }
      } else {
        if (data.price !== undefined) {
          propertyData.price = data.price.toString();
        }
      }
      
      if (imageUrls.length > 0) {
        propertyData.images = imageUrls;
      }
      
      if (selectedAmenities.length > 0) {
        propertyData.amenities = selectedAmenities;
      }
      
      const res = await apiRequest('POST', '/api/properties', propertyData);
      return await res.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/properties'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/properties/pending'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'all' }),
      ]);
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

  const hasAccess = currentUser?.userTypes?.includes('proprietario') || currentUser?.userTypes?.includes('corretor');
  if (!currentUser || !hasAccess) {
    return null;
  }

  const showRoomFields = category === 'Casa' || category === 'Apartamento';
  const availableMunicipios = selectedProvince ? PROVINCIAS_MUNICIPIOS[selectedProvince] || [] : [];

  // Calculate distance between two GPS coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Find the closest location from coordinates
  const findClosestLocation = (lat: number, lng: number) => {
    let closestProvince = '';
    let closestMunicipio = '';
    let minDistanceOverall = Infinity;

    // First, find the closest municipality
    Object.entries(LOCATION_COORDINATES).forEach(([name, coords]) => {
      const distance = calculateDistance(lat, lng, coords.lat, coords.lon);
      
      if (distance < minDistanceOverall) {
        minDistanceOverall = distance;
        
        // Check if this is a province
        if (PROVINCIAS_MUNICIPIOS[name]) {
          closestProvince = name;
        } else {
          // It's a municipality, find which province it belongs to
          for (const [provincia, municipios] of Object.entries(PROVINCIAS_MUNICIPIOS)) {
            if (municipios.includes(name)) {
              closestProvince = provincia;
              closestMunicipio = name;
              break;
            }
          }
        }
      }
    });

    // If we only found a province (not a specific municipality), find the closest municipality within that province
    if (closestProvince && !closestMunicipio) {
      let minMunicipioDistance = Infinity;
      const municipios = PROVINCIAS_MUNICIPIOS[closestProvince] || [];
      
      municipios.forEach((municipio) => {
        if (LOCATION_COORDINATES[municipio]) {
          const coords = LOCATION_COORDINATES[municipio];
          const distance = calculateDistance(lat, lng, coords.lat, coords.lon);
          
          if (distance < minMunicipioDistance) {
            minMunicipioDistance = distance;
            closestMunicipio = municipio;
          }
        }
      });
      
      // If no municipality was found, use the first one from the province
      if (!closestMunicipio && municipios.length > 0) {
        closestMunicipio = municipios[0];
      }
    }

    return { provincia: closestProvince, municipio: closestMunicipio };
  };

  const handleLocationChange = (lat: number, lng: number, isFromGeolocation: boolean = false) => {
    setMapLatitude(lat);
    setMapLongitude(lng);

    // Always update form fields based on the selected location
    const { provincia, municipio } = findClosestLocation(lat, lng);
    
    if (provincia) {
      setValue('provincia', provincia);
      setSelectedProvince(provincia);
      
      // Always set municipality along with province
      if (municipio) {
        // Need to wait for the province to update before setting municipality
        setTimeout(() => {
          setValue('municipio', municipio);
        }, 0);
      }
      
      // Show appropriate toast message
      if (isFromGeolocation) {
        toast({
          title: "Localização detectada",
          description: `${municipio}, ${provincia}`,
        });
      } else {
        toast({
          title: "Localização selecionada",
          description: `${municipio}, ${provincia}`,
        });
      }
    }
  };

  return (
    <div 
      className="min-h-screen pt-24 pb-12 bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-background/80" />
      <div className="max-w-3xl mx-auto px-6 relative z-10">
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
                              <SelectItem value="Coworking" data-testid="option-coworking">Coworking</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.category && (
                        <p className="text-sm text-destructive">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  {watchedCategory !== 'Coworking' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="shortTerm"
                          checked={watchedShortTerm || false}
                          onCheckedChange={(checked) => {
                            setValue("shortTerm", checked as boolean);
                          }}
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
                  )}

                  {watchedCategory !== 'Coworking' && (
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (AOA)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Controller
                          name="price"
                          control={control}
                          render={({ field }) => (
                            <Input
                              id="price"
                              type="text"
                              placeholder="350 000"
                              className="pl-10"
                              value={formattedPrice}
                              onChange={(e) => handlePriceChange(e.target.value, field.onChange)}
                              data-testid="input-price"
                            />
                          )}
                        />
                      </div>
                      {errors.price && (
                        <p className="text-sm text-destructive">{errors.price.message}</p>
                      )}
                    </div>
                  )}

                  {watchedCategory === 'Coworking' && (
                    <div className="space-y-2">
                      <Label htmlFor="pricePerHour">Preço por Hora (AOA)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Controller
                          name="pricePerHour"
                          control={control}
                          render={({ field: { value, onChange, ...rest } }) => (
                            <Input
                              {...rest}
                              id="pricePerHour"
                              type="text"
                              placeholder="5 000"
                              className="pl-10"
                              value={value !== undefined && value !== null ? formatPriceInput(value.toString()) : ''}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, '');
                                if (numericValue) {
                                  onChange(parseInt(numericValue, 10));
                                } else {
                                  onChange(undefined);
                                }
                              }}
                              data-testid="input-price-per-hour"
                            />
                          )}
                        />
                      </div>
                      {errors.pricePerHour && (
                        <p className="text-sm text-destructive">{errors.pricePerHour.message}</p>
                      )}
                    </div>
                  )}

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

                  {/* Map Section */}
                  <div className="space-y-2">
                    <Label>Localização no Mapa</Label>
                    <InteractiveLocationPicker
                      latitude={mapLatitude}
                      longitude={mapLongitude}
                      onLocationChange={handleLocationChange}
                    />
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
                          placeholder="0"
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
                          placeholder="0"
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
                          placeholder="0"
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
                          placeholder="0"
                          {...register("bathrooms")}
                          data-testid="input-bathrooms"
                        />
                        {errors.bathrooms && (
                          <p className="text-sm text-destructive">{errors.bathrooms.message}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Amenities Section */}
                  <div className="space-y-4">
                    <div>
                      <Label>Comodidades</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Selecione as comodidades disponíveis no imóvel
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {AVAILABLE_AMENITIES.map((amenity) => (
                        <div key={amenity} className="flex items-center space-x-2">
                          <Checkbox
                            id={`amenity-${amenity}`}
                            checked={selectedAmenities.includes(amenity)}
                            onCheckedChange={() => toggleAmenity(amenity)}
                            data-testid={`checkbox-${amenity.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <label
                            htmlFor={`amenity-${amenity}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {amenity}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Image upload section */}
                  <div className="space-y-4">
                    <div>
                      <Label>Imagens do Imóvel (até 10)</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        A primeira imagem será a capa do anúncio. Clique na estrela para mudar a capa.
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-2 flex items-center gap-1">
                        <span>✓</span>
                        <span>Suas imagens são armazenadas de forma segura e permanente no banco de dados PostgreSQL (Neon).</span>
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

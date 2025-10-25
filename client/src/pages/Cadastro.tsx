import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Phone, Lock, User, UserPlus } from "lucide-react";
import { useEffect } from "react";
import bgImage from '@assets/stock_images/modern_apartment_bui_506260cd.jpg';

const registerFormSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  phone: z.string().refine(
    (val) => val === "+244" || /^\+244\d{9}$/.test(val),
    "Por favor, digite os 9 dígitos do seu número"
  ),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
  userType: z.enum(['proprietario', 'cliente', 'corretor'], {
    required_error: "Selecione o tipo de usuário",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerFormSchema>;

export default function Cadastro() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  useEffect(() => {
    if (currentUser) {
      setLocation('/');
    }
  }, [currentUser, setLocation]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullName: "",
      phone: "+244",
      password: "",
      confirmPassword: "",
    },
  });

  const phoneValue = watch("phone");

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, ...registerData } = data;
      const res = await apiRequest('POST', '/api/auth/register', registerData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Bem-vindo à BIVA",
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro ao criar sua conta",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 9);
    
    setValue("phone", "+244" + limitedNumbers);
  };

  if (currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen pt-24 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/75" />

      <div className="relative z-10 container mx-auto px-6 py-12 flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Criar Conta na BIVA</CardTitle>
              <CardDescription className="text-center">
                Cadastre-se com o seu número de telemóvel angolano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="João Silva"
                      className="pl-10"
                      {...register("fullName")}
                      data-testid="input-fullname"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive" data-testid="error-fullname">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Número de Telemóvel</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="923456789"
                      className="pl-10"
                      {...register("phone")}
                      onChange={handlePhoneChange}
                      value={phoneValue?.slice(4) || ""}
                      data-testid="input-phone"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-destructive" data-testid="error-phone">
                      {errors.phone.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Exemplo: +244 923456789
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userType">Tipo de Conta</Label>
                  <Controller
                    name="userType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger data-testid="select-usertype">
                          <SelectValue placeholder="Selecione o tipo de conta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proprietario" data-testid="option-proprietario">
                            Proprietário - Tenho imóveis para alugar/vender
                          </SelectItem>
                          <SelectItem value="cliente" data-testid="option-cliente">
                            Cliente - Procuro imóveis
                          </SelectItem>
                          <SelectItem value="corretor" data-testid="option-corretor">
                            Corretor - Trabalho com imóveis
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.userType && (
                    <p className="text-sm text-destructive" data-testid="error-usertype">
                      {errors.userType.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...register("password")}
                      data-testid="input-password"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive" data-testid="error-password">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...register("confirmPassword")}
                      data-testid="input-confirm-password"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive" data-testid="error-confirm-password">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? (
                    "Criando conta..."
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Criar Conta
                    </>
                  )}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Já tem uma conta? </span>
                  <Link href="/login" className="text-primary hover:underline font-semibold" data-testid="link-login">
                    Entrar
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

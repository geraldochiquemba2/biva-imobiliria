import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Phone, Lock, LogIn } from "lucide-react";
import { useEffect } from "react";
import bgImage from '@assets/stock_images/modern_apartment_bui_506260cd.jpg';

const loginFormSchema = z.object({
  phone: z.string().regex(/^\+244\d{9}$/, "Número deve estar no formato +244XXXXXXXXX"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function Login() {
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
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      phone: "+244",
      password: "",
    },
  });

  const phoneValue = watch("phone");

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest('POST', '/api/auth/login', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta à BIVA",
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Número de telefone ou senha incorretos",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
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
              <CardTitle className="text-2xl font-bold text-center">Entrar na BIVA</CardTitle>
              <CardDescription className="text-center">
                Entre com o seu número de telemóvel angolano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Número de Telemóvel</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <span className="absolute left-10 top-3 text-sm text-muted-foreground pointer-events-none">
                      +244
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="923456789"
                      className="pl-[4.5rem]"
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    "Entrando..."
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Não tem uma conta? </span>
                  <Link href="/cadastro" className="text-primary hover:underline font-semibold" data-testid="link-register">
                    Cadastre-se
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

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User as UserIcon, Mail, Phone, MessageSquare, MapPin, CreditCard } from "lucide-react";
import usersImg from '@assets/stock_images/team_business_profes_5f1b3f15.jpg';

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    sms: "",
    address: "",
    bi: "",
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        sms: currentUser.sms || "",
        address: currentUser.address || "",
        bi: currentUser.bi || "",
      });
    }
  }, [currentUser]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest('PATCH', '/api/auth/profile', data);
      return await res.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'], refetchType: 'all' }),
      ]);
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar perfil",
        variant: "destructive",
      });
    },
  });

  if (userLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    setLocation('/login');
    return null;
  }

  const userTypeLabels: Record<string, string> = {
    proprietario: 'Proprietário',
    cliente: 'Cliente',
    corretor: 'Corretor',
    admin: 'Administrador',
  };
  
  const userRolesText = currentUser.userTypes?.map(type => userTypeLabels[type]).join(' • ') || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      fullName: currentUser?.fullName || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
      sms: currentUser?.sms || "",
      address: currentUser?.address || "",
      bi: currentUser?.bi || "",
    });
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-profile-title">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais
          </p>
        </div>

        <Card className="relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${usersImg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">
                    {getInitials(currentUser.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{currentUser.fullName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {userRolesText}
                  </p>
                </div>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-profile"
                >
                  Editar Perfil
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    <UserIcon className="inline h-4 w-4 mr-2" />
                    Nome Completo
                  </Label>
                  <Input
                    id="fullName"
                    value={isEditing ? formData.fullName : currentUser.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-fullname"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={isEditing ? formData.email : (currentUser.email || '')}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={isEditing ? formData.phone : currentUser.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sms">
                    <MessageSquare className="inline h-4 w-4 mr-2" />
                    WhatsApp / SMS
                  </Label>
                  <Input
                    id="sms"
                    value={isEditing ? formData.sms : (currentUser.sms || '')}
                    onChange={(e) => setFormData({ ...formData, sms: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Número para WhatsApp"
                    data-testid="input-sms"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bi">
                    <CreditCard className="inline h-4 w-4 mr-2" />
                    BI / Passaporte
                  </Label>
                  <Input
                    id="bi"
                    value={isEditing ? formData.bi : (currentUser.bi || '')}
                    onChange={(e) => setFormData({ ...formData, bi: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Número do documento"
                    data-testid="input-bi"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">
                    <MapPin className="inline h-4 w-4 mr-2" />
                    Endereço
                  </Label>
                  <Input
                    id="address"
                    value={isEditing ? formData.address : (currentUser.address || '')}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Endereço completo"
                    data-testid="input-address"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save"
                  >
                    {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

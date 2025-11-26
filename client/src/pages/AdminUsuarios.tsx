import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Property } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  ArrowLeft, 
  Lock,
  Unlock,
  Building2,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Search,
  Clock,
  KeyRound
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminUsuarios() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPropertiesDialogOpen, setUserPropertiesDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: currentUser?.userTypes?.includes('admin'),
  });

  const { data: selectedUserProperties = [] } = useQuery<Property[]>({
    queryKey: ['/api/users', selectedUser?.id, 'properties'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${selectedUser?.id}/properties`);
      if (!response.ok) throw new Error('Failed to fetch user properties');
      return response.json();
    },
    enabled: !!selectedUser && userPropertiesDialogOpen,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: string }) => {
      const res = await apiRequest('PATCH', `/api/users/${userId}/status`, { status: newStatus });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: data.status === 'ativo' ? "Desbloqueado" : "Bloqueado",
        description: data.fullName,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const res = await apiRequest('POST', `/api/users/${userId}/reset-password`, { newPassword });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao redefinir senha');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha redefinida",
        description: `A senha de ${resetPasswordUser?.fullName} foi redefinida com sucesso.`,
      });
      setResetPasswordDialogOpen(false);
      setResetPasswordUser(null);
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!userLoading && !currentUser) {
      setLocation('/login');
    } else if (currentUser && !currentUser.userTypes?.includes('admin')) {
      setLocation('/dashboard');
    }
  }, [currentUser, userLoading, setLocation]);

  if (userLoading || usersLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser || !currentUser.userTypes?.includes('admin')) {
    return null;
  }

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'ativo' ? 'bloqueado' : 'ativo';
    toggleStatusMutation.mutate({ userId: user.id, newStatus });
  };

  const handleViewProperties = (user: User) => {
    setSelectedUser(user);
    setUserPropertiesDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setResetPasswordUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }
    
    if (resetPasswordUser) {
      resetPasswordMutation.mutate({
        userId: resetPasswordUser.id,
        newPassword,
      });
    }
  };

  const handleResetPasswordCancel = () => {
    setResetPasswordDialogOpen(false);
    setResetPasswordUser(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const usersByType = {
    admin: users.filter(u => u.userTypes?.includes('admin')),
    corretor: users.filter(u => u.userTypes?.includes('corretor')),
    proprietario: users.filter(u => u.userTypes?.includes('proprietario')),
    cliente: users.filter(u => u.userTypes?.includes('cliente')),
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(searchLower) ||
      user.phone.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const activeUsers = filteredUsers.filter(u => u.status === 'ativo');
  const blockedUsers = filteredUsers.filter(u => u.status === 'bloqueado');

  // Calcular tempo total de login dos usuários ativos
  const totalLoginTime = activeUsers.reduce((total, user) => {
    if (user.lastLoginAt) {
      const now = new Date();
      const loginTime = new Date(user.lastLoginAt);
      const diffInMs = now.getTime() - loginTime.getTime();
      return total + diffInMs;
    }
    return total;
  }, 0);

  // Converter para formato legível
  const formatTotalTime = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '<1m';
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <Button
              variant="ghost"
              asChild
              className="mb-4"
              data-testid="button-back"
            >
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Link>
            </Button>
            <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
              Usuários
            </h1>
            <p className="text-muted-foreground mb-6">
              Gerencie os usuários da plataforma
            </p>
            
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por nome ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tempo total: {totalLoginTime > 0 ? formatTotalTime(totalLoginTime) : '0m'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bloqueados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{blockedUsers.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Proprietários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{usersByType.proprietario.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Users Sections - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Users Section */}
            <Card>
              <CardHeader>
                <CardTitle>Usuários Ativos</CardTitle>
                <CardDescription>
                  {activeUsers.length} {activeUsers.length === 1 ? 'usuário ativo' : 'usuários ativos'}
                  {searchTerm && ` (filtrado de ${users.filter(u => u.status === 'ativo').length})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm ? 'Nenhum resultado' : 'Sem usuários ativos'}
                    </h3>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeUsers.map((user) => (
                      <Card key={user.id} className="hover-elevate" data-testid={`user-card-${user.id}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-14 w-14">
                              <AvatarImage src={user.profileImage || undefined} />
                              <AvatarFallback>
                                {user.fullName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                  <h3 className="font-semibold text-base" data-testid={`user-name-${user.id}`}>
                                    {user.fullName}
                                  </h3>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {user.userTypes?.map(type => (
                                      <Badge key={type} variant="secondary" className="text-xs">
                                        {type === 'proprietario' ? 'Proprietário' :
                                         type === 'corretor' ? 'Corretor' :
                                         type === 'admin' ? 'Administrador' : 'Cliente'}
                                      </Badge>
                                    ))}
                                    <Badge
                                      variant={user.status === 'ativo' ? 'default' : 'destructive'}
                                      className="text-xs"
                                      data-testid={`user-status-${user.id}`}
                                    >
                                      {user.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span>{user.phone}</span>
                                </div>
                                {user.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span>
                                    {user.lastLoginAt 
                                      ? `Logado há ${formatDistanceToNow(new Date(user.lastLoginAt), { locale: ptBR, addSuffix: false })}`
                                      : 'Nunca fez login'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {(user.userTypes?.includes('proprietario') || user.userTypes?.includes('corretor')) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewProperties(user)}
                                    data-testid={`button-view-properties-${user.id}`}
                                  >
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Ver Propriedades
                                  </Button>
                                )}
                                
                                {user.id !== currentUser.id && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleResetPassword(user)}
                                      data-testid={`button-reset-password-${user.id}`}
                                    >
                                      <KeyRound className="h-4 w-4 mr-2" />
                                      Redefinir Senha
                                    </Button>
                                    <Button
                                      variant={user.status === 'ativo' ? 'destructive' : 'default'}
                                      size="sm"
                                      onClick={() => handleToggleStatus(user)}
                                      disabled={toggleStatusMutation.isPending}
                                      data-testid={`button-toggle-status-${user.id}`}
                                    >
                                      {user.status === 'ativo' ? (
                                        <>
                                          <Lock className="h-4 w-4 mr-2" />
                                          Bloquear
                                        </>
                                      ) : (
                                        <>
                                          <Unlock className="h-4 w-4 mr-2" />
                                          Desbloquear
                                        </>
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blocked Users Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Usuários Bloqueados</CardTitle>
                <CardDescription>
                  {blockedUsers.length} {blockedUsers.length === 1 ? 'usuário bloqueado' : 'usuários bloqueados'}
                  {searchTerm && ` (filtrado de ${users.filter(u => u.status === 'bloqueado').length})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blockedUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm ? 'Nenhum resultado' : 'Sem bloqueados'}
                    </h3>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {blockedUsers.map((user) => (
                      <Card key={user.id} className="hover-elevate border-destructive/20" data-testid={`user-card-${user.id}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-14 w-14 opacity-60">
                              <AvatarImage src={user.profileImage || undefined} />
                              <AvatarFallback>
                                {user.fullName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                  <h3 className="font-semibold text-base" data-testid={`user-name-${user.id}`}>
                                    {user.fullName}
                                  </h3>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {user.userTypes?.map(type => (
                                      <Badge key={type} variant="secondary" className="text-xs">
                                        {type === 'proprietario' ? 'Proprietário' :
                                         type === 'corretor' ? 'Corretor' :
                                         type === 'admin' ? 'Administrador' : 'Cliente'}
                                      </Badge>
                                    ))}
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                      data-testid={`user-status-${user.id}`}
                                    >
                                      Bloqueado
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span>{user.phone}</span>
                                </div>
                                {user.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span>
                                    {user.lastLoginAt 
                                      ? `Logado há ${formatDistanceToNow(new Date(user.lastLoginAt), { locale: ptBR, addSuffix: false })}`
                                      : 'Nunca fez login'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {(user.userTypes?.includes('proprietario') || user.userTypes?.includes('corretor')) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewProperties(user)}
                                    data-testid={`button-view-properties-${user.id}`}
                                  >
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Ver Propriedades
                                  </Button>
                                )}
                                
                                {user.id !== currentUser.id && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleResetPassword(user)}
                                      data-testid={`button-reset-password-blocked-${user.id}`}
                                    >
                                      <KeyRound className="h-4 w-4 mr-2" />
                                      Redefinir Senha
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleToggleStatus(user)}
                                      disabled={toggleStatusMutation.isPending}
                                      data-testid={`button-toggle-status-${user.id}`}
                                    >
                                      <Unlock className="h-4 w-4 mr-2" />
                                      Desbloquear
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

      <Dialog open={userPropertiesDialogOpen} onOpenChange={setUserPropertiesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Propriedades de {selectedUser?.fullName}</DialogTitle>
            <DialogDescription>
              {selectedUserProperties.length} {selectedUserProperties.length === 1 ? 'imóvel' : 'imóveis'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedUserProperties.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Sem imóveis cadastrados
                </p>
              </div>
            ) : (
              selectedUserProperties.map((property) => (
                <Card key={property.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">
                          {property.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.bairro}, {property.municipio}
                        </CardDescription>
                      </div>
                      <Badge variant={property.status === 'disponivel' ? 'default' : 'secondary'}>
                        {property.status === 'disponivel' ? 'Disponível' : property.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold">
                        {parseFloat(property.price).toLocaleString('pt-AO')} Kz
                        {property.type === 'Arrendar' && (
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link to={`/imoveis/${property.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPasswordDialogOpen} onOpenChange={(open) => {
        if (!open) handleResetPasswordCancel();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {resetPasswordUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                  data-testid="input-reset-new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  data-testid="input-reset-confirm-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetPasswordCancel}
                data-testid="button-cancel-reset-password"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                data-testid="button-submit-reset-password"
              >
                {resetPasswordMutation.isPending ? 'Redefinindo...' : 'Redefinir Senha'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  Search,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminUsuarios() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPropertiesDialogOpen, setUserPropertiesDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: currentUser?.userType === 'admin',
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
        title: data.status === 'ativo' ? "Usuário desbloqueado" : "Usuário bloqueado",
        description: `${data.fullName} foi ${data.status === 'ativo' ? 'desbloqueado' : 'bloqueado'} com sucesso`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!userLoading && !currentUser) {
      setLocation('/login');
    } else if (currentUser && currentUser.userType !== 'admin') {
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

  if (!currentUser || currentUser.userType !== 'admin') {
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

  const usersByType = {
    admin: users.filter(u => u.userType === 'admin'),
    corretor: users.filter(u => u.userType === 'corretor'),
    proprietario: users.filter(u => u.userType === 'proprietario'),
    cliente: users.filter(u => u.userType === 'cliente'),
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
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Link>
            </Button>
            <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
              Gerenciar Usuários
            </h1>
            <p className="text-muted-foreground mb-6">
              Visualize e gerencie todos os usuários do sistema
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
                      {searchTerm ? 'Nenhum usuário ativo encontrado' : 'Nenhum usuário ativo'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Tente ajustar os termos de pesquisa' : 'Ainda não há usuários ativos no sistema'}
                    </p>
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
                                    <Badge variant="secondary" className="text-xs">
                                      {user.userType === 'proprietario' ? 'Proprietário' :
                                       user.userType === 'corretor' ? 'Corretor' :
                                       user.userType === 'admin' ? 'Administrador' : 'Cliente'}
                                    </Badge>
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
                                    Na plataforma há {formatDistanceToNow(new Date(user.createdAt), { locale: ptBR, addSuffix: false })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {(user.userType === 'proprietario' || user.userType === 'corretor') && (
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
                      {searchTerm ? 'Nenhum usuário bloqueado encontrado' : 'Nenhum usuário bloqueado'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Tente ajustar os termos de pesquisa' : 'Não há usuários bloqueados no momento'}
                    </p>
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
                                    <Badge variant="secondary" className="text-xs">
                                      {user.userType === 'proprietario' ? 'Proprietário' :
                                       user.userType === 'corretor' ? 'Corretor' :
                                       user.userType === 'admin' ? 'Administrador' : 'Cliente'}
                                    </Badge>
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
                                    Na plataforma há {formatDistanceToNow(new Date(user.createdAt), { locale: ptBR, addSuffix: false })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {(user.userType === 'proprietario' || user.userType === 'corretor') && (
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
                  Este usuário ainda não possui imóveis cadastrados
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
                        <Link href={`/imoveis/${property.id}`}>
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
    </div>
  );
}

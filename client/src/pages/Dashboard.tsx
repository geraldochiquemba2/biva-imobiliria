import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { User, Property, Contract, Visit } from "@shared/schema";
import { Building2, Calendar, FileText, Plus, Home, Users } from "lucide-react";
import buildingImg from '@assets/stock_images/modern_apartment_bui_70397924.jpg';
import calendarImg from '@assets/stock_images/calendar_schedule_pl_ee22d3c7.jpg';
import contractImg from '@assets/stock_images/contract_document_bu_dc6f6b53.jpg';
import houseImg from '@assets/stock_images/real_estate_house_pr_f8d266a1.jpg';
import usersImg from '@assets/stock_images/team_business_profes_5f1b3f15.jpg';

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const hasRole = (role: string) => currentUser?.userTypes?.includes(role) || false;

  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    staleTime: 30000,
  });

  const { data: myOwnProperties = [], isLoading: myPropertiesLoading } = useQuery<Property[]>({
    queryKey: [`/api/users/${currentUser?.id}/properties`],
    enabled: !!currentUser?.id && (hasRole('proprietario') || hasRole('corretor')),
    staleTime: 30000,
  });

  useEffect(() => {
    if (!userLoading && !currentUser) {
      setLocation('/login');
    }
  }, [currentUser, userLoading, setLocation]);
  
  const allSystemProperties = properties;
  
  const availableProperties = properties.filter(p => p.status === 'disponivel');

  const { data: userContracts = [], isLoading: userContractsLoading } = useQuery<Contract[]>({
    queryKey: [`/api/users/${currentUser?.id}/contracts`],
    enabled: !!currentUser?.id && (hasRole('cliente') || hasRole('proprietario')),
    staleTime: 30000,
  });

  const { data: allContracts = [], isLoading: allContractsLoading } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
    enabled: !!currentUser?.id && hasRole('admin'),
    staleTime: 30000,
  });

  const contracts = hasRole('admin')
    ? allContracts 
    : userContracts;

  const { data: userVisits = [] } = useQuery<Visit[]>({
    queryKey: [`/api/visits`],
    enabled: !!currentUser?.id && !hasRole('admin'),
    staleTime: 30000,
  });

  const { data: allSystemVisits = [] } = useQuery<Visit[]>({
    queryKey: [`/api/visits`],
    enabled: !!currentUser?.id && hasRole('admin'),
    staleTime: 30000,
  });

  const allVisits = hasRole('admin') ? allSystemVisits : userVisits;

  if (userLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const userTypeLabels: Record<string, string> = {
    proprietario: 'Proprietário',
    cliente: 'Cliente',
    corretor: 'Corretor',
    admin: 'Administrador',
  };
  
  const userRolesText = currentUser.userTypes?.map(type => userTypeLabels[type]).join(' • ') || '';

  const activeContracts = contracts.filter(c => 
    c.status === 'ativo' || 
    c.status === 'pendente_assinaturas' ||
    c.status === 'assinado_proprietario' ||
    c.status === 'assinado_cliente'
  );
  const scheduledVisits = allVisits.filter(v => 
    v.status === 'agendada' || 
    v.status === 'pendente_proprietario' || 
    v.status === 'pendente_cliente'
  );

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" data-testid="text-dashboard-title">
              Bem-vindo, {currentUser.fullName}
            </h1>
            <p className="text-muted-foreground" data-testid="text-user-type">
              {userRolesText}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {(hasRole('proprietario') || hasRole('corretor')) && (
              <Link href="/meus-imoveis">
                <Card className="hover-elevate active-elevate-2 cursor-pointer relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url(${buildingImg})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium">
                      Meus Imóveis
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold" data-testid="text-properties-count">
                      {myPropertiesLoading ? '...' : myOwnProperties.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Imóveis cadastrados
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}

            {(hasRole('proprietario') || hasRole('cliente') || hasRole('corretor')) && (
              <Link href="/contratos-ativos">
                <Card className="hover-elevate cursor-pointer active-elevate-2 relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url(${contractImg})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium">
                      Contratos Ativos
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold" data-testid="text-contracts-count">
                      {activeContracts.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ativos
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}

            {(hasRole('proprietario') || hasRole('cliente') || hasRole('corretor')) && (
              <Link href="/visitas-agendadas">
                <Card className="hover-elevate cursor-pointer active-elevate-2 relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url(${calendarImg})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium">
                      Visitas Agendadas
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold" data-testid="text-visits-count">
                      {scheduledVisits.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Próximas visitas
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}

            {hasRole('cliente') && (
              <Link href="/imoveis">
                <Card className="hover-elevate cursor-pointer active-elevate-2 relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url(${houseImg})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium">
                      Imóveis Disponíveis
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold" data-testid="text-properties-count">
                      {propertiesLoading ? '...' : availableProperties.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Para explorar
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}

            {hasRole('admin') && (
              <>
                <Link href="/admin/imoveis">
                  <Card className="hover-elevate cursor-pointer active-elevate-2 relative overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-20"
                      style={{ backgroundImage: `url(${buildingImg})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative z-10">
                      <CardTitle className="text-sm font-medium">
                        Total de Imóveis
                      </CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="text-2xl font-bold" data-testid="text-properties-count">
                        {propertiesLoading ? '...' : allSystemProperties.length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        No sistema
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/contratos-ativos">
                  <Card className="hover-elevate cursor-pointer active-elevate-2 relative overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-20"
                      style={{ backgroundImage: `url(${contractImg})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative z-10">
                      <CardTitle className="text-sm font-medium">
                        Contratos Ativos
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="text-2xl font-bold" data-testid="text-admin-contracts-count">
                        {activeContracts.length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ativos
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/visitas-agendadas">
                  <Card className="hover-elevate cursor-pointer active-elevate-2 relative overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-20"
                      style={{ backgroundImage: `url(${calendarImg})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative z-10">
                      <CardTitle className="text-sm font-medium">
                        Visitas Agendadas
                      </CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="text-2xl font-bold" data-testid="text-visits-count">
                        {scheduledVisits.length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total agendadas
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/usuarios">
                  <Card className="hover-elevate cursor-pointer active-elevate-2 relative overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-20"
                      style={{ backgroundImage: `url(${usersImg})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative z-10">
                      <CardTitle className="text-sm font-medium">
                        Gerenciar Usuários
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="text-2xl font-bold" data-testid="text-users-count">
                        •••
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Acessar gerenciamento
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(hasRole('proprietario') || hasRole('corretor')) && (
              <Link href="/meus-imoveis">
                <Card className="relative overflow-hidden hover-elevate active-elevate-2 cursor-pointer h-full">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url(${buildingImg})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                  <CardHeader className="relative z-10">
                    <CardTitle>Meus Imóveis</CardTitle>
                    <CardDescription>
                      Gerencie seus imóveis cadastrados na plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    {myPropertiesLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : myOwnProperties.length === 0 ? (
                      <div className="text-center py-12">
                        <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                          Nenhum imóvel cadastrado
                        </h3>
                        <p className="text-muted-foreground">
                          Clique aqui para começar a cadastrar seus imóveis
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-center text-muted-foreground">
                          Clique para ver todos os seus {myOwnProperties.length} {myOwnProperties.length === 1 ? 'imóvel' : 'imóveis'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )}

            {hasRole('cliente') && (
              <Link href="/imoveis">
                <Card className="relative overflow-hidden hover-elevate active-elevate-2 cursor-pointer h-full">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url(${houseImg})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                  <CardHeader className="relative z-10">
                    <CardTitle>Encontre seu Imóvel Ideal</CardTitle>
                    <CardDescription>
                      Explore nossa seleção de imóveis disponíveis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center py-8 relative z-10">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-6">
                      Navegue pelos imóveis disponíveis para encontrar o perfeito para você
                    </p>
                    <Button asChild data-testid="button-browse-properties">
                      <span>Ver Imóveis Disponíveis</span>
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

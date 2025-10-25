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

  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  useEffect(() => {
    if (!userLoading && !currentUser) {
      setLocation('/login');
    }
  }, [currentUser, userLoading, setLocation]);

  const hasRole = (role: string) => currentUser?.userTypes?.includes(role) || false;
  
  const userProperties = hasRole('admin') || hasRole('corretor')
    ? properties 
    : properties.filter(p => p.ownerId === (currentUser?.id || ''));

  const { data: userContracts = [] } = useQuery<Contract[]>({
    queryKey: [`/api/users/${currentUser?.id}/contracts`],
    enabled: !!currentUser?.id && (hasRole('cliente') || hasRole('proprietario')),
  });

  const { data: allContracts = [] } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
    enabled: !!currentUser?.id && (hasRole('admin') || hasRole('corretor')),
  });

  const contracts = hasRole('admin') || hasRole('corretor')
    ? allContracts 
    : userContracts;

  const { data: clientVisits = [] } = useQuery<Visit[]>({
    queryKey: [`/api/users/${currentUser?.id}/visits`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${currentUser?.id}/visits`);
      if (!response.ok) throw new Error('Failed to fetch visits');
      return response.json();
    },
    enabled: !!currentUser?.id && hasRole('cliente'),
  });

  const { data: propertyVisits = [] } = useQuery<Visit[]>({
    queryKey: [`/api/properties/visits`, userProperties.map(p => p.id)],
    queryFn: async () => {
      const allVisits: Visit[] = [];
      for (const property of userProperties) {
        const response = await fetch(`/api/properties/${property.id}/visits`);
        if (response.ok) {
          const visits = await response.json();
          allVisits.push(...visits);
        }
      }
      return allVisits;
    },
    enabled: !!currentUser?.id && (hasRole('proprietario') || hasRole('corretor') || hasRole('admin')) && userProperties.length > 0,
  });

  const allVisits = [...clientVisits, ...propertyVisits];

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

  const activeContracts = contracts.filter(c => c.status === 'ativo');
  const scheduledVisits = allVisits.filter(v => v.status === 'agendada');

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
              <Card className="hover-elevate relative overflow-hidden">
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
                    {propertiesLoading ? '...' : userProperties.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Imóveis cadastrados
                  </p>
                </CardContent>
              </Card>
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
                      Em andamento
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
              <Card className="hover-elevate relative overflow-hidden">
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
                    {propertiesLoading ? '...' : properties.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Para explorar
                  </p>
                </CardContent>
              </Card>
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
                        {propertiesLoading ? '...' : userProperties.length}
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
                      <div className="text-2xl font-bold" data-testid="text-contracts-count">
                        {activeContracts.length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Em andamento
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
              <Card className="relative overflow-hidden">
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
                  {propertiesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : userProperties.length === 0 ? (
                    <div className="text-center py-12">
                      <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        Nenhum imóvel cadastrado
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Comece cadastrando seu primeiro imóvel para arrendar ou vender
                      </p>
                      <Button asChild data-testid="button-add-property">
                        <Link href="/cadastrar-imovel">
                          <Plus className="h-4 w-4 mr-2" />
                          Cadastrar Imóvel
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userProperties.map((property) => (
                        <Card key={property.id} className="hover-elevate">
                          <CardHeader>
                            <CardTitle className="text-base">{property.title}</CardTitle>
                            <CardDescription>
                              {property.category} - {property.type}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">
                                {property.bairro}, {property.municipio}
                              </div>
                              <div className="text-lg font-bold">
                                {Number(property.price).toLocaleString('pt-AO', {
                                  style: 'currency',
                                  currency: 'AOA',
                                })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {hasRole('cliente') && (
              <Card className="relative overflow-hidden">
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
                    <Link href="/imoveis">
                      Ver Imóveis Disponíveis
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

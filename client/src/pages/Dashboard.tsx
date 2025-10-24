import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { User, Property } from "@shared/schema";
import { Building2, Calendar, FileText, Plus, Home } from "lucide-react";

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
  };

  const userProperties = properties.filter(p => p.ownerId === currentUser.id);

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
              {userTypeLabels[currentUser.userType]}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentUser.userType === 'proprietario' && (
              <>
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Meus Imóveis
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-properties-count">
                      {propertiesLoading ? '...' : userProperties.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Imóveis cadastrados
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Contratos Ativos
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Em andamento
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Visitas Agendadas
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Próximas visitas
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {currentUser.userType === 'cliente' && (
              <>
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Visitas Agendadas
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Próximas visitas
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Propostas Enviadas
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Aguardando resposta
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Favoritos
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Imóveis salvos
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {currentUser.userType === 'corretor' && (
              <>
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Imóveis Gerenciados
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Total de imóveis
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Clientes Ativos
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Em atendimento
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Visitas Agendadas
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Este mês
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {currentUser.userType === 'proprietario' && (
            <Card>
              <CardHeader>
                <CardTitle>Meus Imóveis</CardTitle>
                <CardDescription>
                  Gerencie seus imóveis cadastrados na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
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

          {currentUser.userType === 'cliente' && (
            <Card>
              <CardHeader>
                <CardTitle>Encontre seu Imóvel Ideal</CardTitle>
                <CardDescription>
                  Explore nossa seleção de imóveis disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
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

          {currentUser.userType === 'corretor' && (
            <Card>
              <CardHeader>
                <CardTitle>Painel do Corretor</CardTitle>
                <CardDescription>
                  Gerencie seus clientes e imóveis
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-6">
                  Ferramentas de gestão de imóveis e clientes em desenvolvimento
                </p>
                <Button asChild variant="outline" data-testid="button-view-all-properties">
                  <Link href="/imoveis">
                    Ver Todos os Imóveis
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}

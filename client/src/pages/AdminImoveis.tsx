import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { User, Property, PaginatedPropertiesResponse } from "@shared/schema";
import {
  Building2,
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Eye,
  Home,
  Clock,
} from "lucide-react";

export default function AdminImoveis() {
  const [, setLocation] = useLocation();

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const { data: propertiesResponse, isLoading: propertiesLoading } = useQuery<PaginatedPropertiesResponse>({
    queryKey: ['/api/properties'],
  });

  const properties = propertiesResponse?.data || [];

  const { data: pendingProperties = [], isLoading: pendingPropertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties/pending'],
  });

  useEffect(() => {
    if (!userLoading && !currentUser) {
      setLocation('/login');
    } else if (currentUser && !currentUser.userTypes?.includes('admin')) {
      setLocation('/dashboard');
    }
  }, [currentUser, userLoading, setLocation]);

  if (userLoading || propertiesLoading || pendingPropertiesLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser || !currentUser.userTypes?.includes('admin')) {
    return null;
  }

  const propertiesByStatus = {
    disponivel: properties.filter(p => p.status === 'disponivel'),
    arrendado: properties.filter(p => p.status === 'arrendado'),
    vendido: properties.filter(p => p.status === 'vendido'),
    indisponivel: properties.filter(p => p.status === 'indisponivel'),
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
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
                Gerenciar Imóveis
              </h1>
              <p className="text-muted-foreground">
                Visualize e gerencie todos os imóveis do sistema
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Link to="/admin/aprovar-imoveis">
              <Card className="hover-elevate active-elevate-2 cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-count">
                    {pendingProperties.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aguardando aprovação
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {propertiesByStatus.disponivel.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Arrendados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {propertiesByStatus.arrendado.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {propertiesByStatus.vendido.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Indisponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {propertiesByStatus.indisponivel.length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Todos os Imóveis</CardTitle>
              <CardDescription>
                {properties.length} {properties.length === 1 ? 'imóvel' : 'imóveis'} no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum imóvel cadastrado
                  </h3>
                  <p className="text-muted-foreground">
                    Ainda não há imóveis no sistema
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {properties.map((property) => (
                    <Card key={property.id} className="overflow-hidden">
                      <CardHeader className="p-0">
                        <div className="relative h-48 overflow-hidden">
                          {(property as any).thumbnail ? (
                            <img
                              src={(property as any).thumbnail}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Home className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start justify-between gap-4 pt-4">
                          <div className="flex-1">
                            <CardTitle className="text-base mb-1">
                              {property.title}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.bairro}, {property.municipio}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={
                              property.status === 'disponivel' ? 'default' :
                              property.status === 'arrendado' ? 'secondary' :
                              property.status === 'vendido' ? 'outline' : 'destructive'
                            }
                            data-testid={`property-status-${property.id}`}
                          >
                            {property.status === 'disponivel' ? 'Disponível' :
                             property.status === 'arrendado' ? 'Arrendado' :
                             property.status === 'vendido' ? 'Vendido' : 'Indisponível'}
                          </Badge>
                        </div>
                      </CardContent>
                      <CardContent>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {property.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {property.type === 'Arrendar' ? 'Disponível para arrendar' : property.type === 'Vender' ? 'Disponível para compra' : property.type}
                              </Badge>
                            </div>
                            {property.bedrooms > 0 && (
                              <div className="flex items-center gap-1">
                                <Bed className="h-4 w-4" />
                                <span>{property.bedrooms}</span>
                              </div>
                            )}
                            {property.bathrooms > 0 && (
                              <div className="flex items-center gap-1">
                                <Bath className="h-4 w-4" />
                                <span>{property.bathrooms}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Maximize className="h-4 w-4" />
                              <span>{property.area}m²</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
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
                              data-testid={`button-view-${property.id}`}
                            >
                              <Link to={`/imoveis/${property.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
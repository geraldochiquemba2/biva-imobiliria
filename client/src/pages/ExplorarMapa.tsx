import { motion } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Navigation, MapPin, Home, Ruler, DollarSign, X } from "lucide-react";
import L from "leaflet";
import type { Property } from "@shared/schema";
import { formatAOA } from "@/lib/currency";
import { Link } from "wouter";
import { angolaProvinces } from "@shared/angola-locations";
import bgImage from '@assets/stock_images/aerial_view_city_map_83390299.jpg';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface PropertyWithDistance extends Property {
  distance: number;
}

export default function ExplorarMapa() {
  const { toast } = useToast();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayersRef = useRef<L.Polyline[]>([]);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [nearbyProperties, setNearbyProperties] = useState<PropertyWithDistance[]>([]);
  const [showNearby, setShowNearby] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [selectedProvincia, setSelectedProvincia] = useState<string>("");
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>("");

  const { data: allProperties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // Filtrar imóveis disponíveis e por província/município
  const properties = useMemo(() => {
    let filtered = allProperties?.filter(property => property.status === 'disponivel') || [];
    
    if (selectedProvincia && selectedProvincia !== "all") {
      filtered = filtered.filter(p => p.provincia === selectedProvincia);
    }
    
    if (selectedMunicipio && selectedMunicipio !== "all") {
      filtered = filtered.filter(p => p.municipio === selectedMunicipio);
    }
    
    return filtered;
  }, [allProperties, selectedProvincia, selectedMunicipio]);

  // Municípios disponíveis da província selecionada
  const availableMunicipios = useMemo(() => {
    if (!selectedProvincia || selectedProvincia === "all") return [];
    const province = angolaProvinces.find(p => p.name === selectedProvincia);
    return province?.municipalities || [];
  }, [selectedProvincia]);

  // Calculate distance between two points using Haversine formula
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

  // Initialize map
  useEffect(() => {
    if (isLoading || !mapContainerRef.current) return;

    // Clear any pending initialization
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }

    // Wait for the page animation and DOM to settle
    initTimeoutRef.current = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Cleanup existing map if any
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error('Error removing existing map:', e);
        }
        mapRef.current = null;
      }

      try {
        // Initialize Leaflet map centered on Angola
        const map = L.map(mapContainerRef.current, {
          center: [-12.5, 17.5],
          zoom: 6,
          maxZoom: 17,
          zoomControl: true,
          scrollWheelZoom: true,
        });
        
        // Define different tile layers for better visualization
        const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
          minZoom: 3,
          subdomains: 'abcd',
        });

        const hybridLayer = L.layerGroup([
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19,
            maxNativeZoom: 18,
            minZoom: 3,
          }),
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19,
            minZoom: 3,
          })
        ]);

        // POI layer - Shows institutions and points of interest
        const poiLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
          minZoom: 10,
          opacity: 1,
          subdomains: 'abcd',
        });

        // Add default layer (hybrid for more realistic view)
        hybridLayer.addTo(map);

        // Add layer control
        const baseLayers = {
          "Híbrido (Satélite + Rótulos)": hybridLayer,
          "Ruas": streetLayer,
        };

        const overlayLayers = {
          "Instituições e POIs": poiLayer,
        };

        L.control.layers(baseLayers, overlayLayers, {
          position: 'topright',
          collapsed: false,
        }).addTo(map);

        mapRef.current = map;

        // Force map to recalculate size after tiles load
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 100);
        
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
            setMapInitialized(true);
          }
        }, 500);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 800);

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error('Error cleaning up map:', e);
        }
        mapRef.current = null;
      }
      setMapInitialized(false);
    };
  }, [isLoading]);

  // Add property markers
  useEffect(() => {
    if (!mapRef.current || !properties || !mapInitialized) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for all properties
    properties.forEach((property) => {
      if (property.latitude && property.longitude) {
        const lat = parseFloat(property.latitude);
        const lng = parseFloat(property.longitude);

        // Create custom icon based on property type
        const iconColor = property.type === 'Vender' ? '#dc2626' : '#2563eb';
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${iconColor}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        });

        const imageHtml = property.images && property.images.length > 0 
          ? `<img src="${property.images[0]}" alt="${property.title}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;" />`
          : '';

        const marker = L.marker([lat, lng], { icon: customIcon })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div style="min-width: 220px; max-width: 250px;">
              ${imageHtml}
              <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">${property.title}</h3>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${property.bairro}, ${property.municipio}</p>
              <p style="margin: 0 0 8px 0; font-weight: bold; color: ${iconColor};">${formatAOA(property.price)}</p>
              <a href="/imoveis/${property.id}" style="color: #2563eb; text-decoration: underline; font-size: 12px;">Ver detalhes</a>
            </div>
          `);

        marker.on('click', () => {
          setSelectedProperty(property);
        });

        markersRef.current.push(marker);
      }
    });

    // Fit map to show all properties
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.2), { maxZoom: 13 });
    }
  }, [properties, mapInitialized]);

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Obtendo localização...",
      description: "Por favor, permita o acesso à sua localização",
      duration: 3000,
    });

    // Tentar primeiro com baixa precisão (mais rápido e funciona melhor em móveis)
    requestUserLocation(false);
  };

  const requestUserLocation = (highAccuracy: boolean = false) => {
    const options = {
      enableHighAccuracy: highAccuracy,
      timeout: highAccuracy ? 10000 : 5000,
      maximumAge: highAccuracy ? 0 : 60000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: [number, number] = [latitude, longitude];
        setUserLocation(location);

        if (mapRef.current) {
          // Add user location marker
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          L.marker(location, { icon: userIcon })
            .addTo(mapRef.current)
            .bindPopup("<b>Você está aqui</b>");

          mapRef.current.setView(location, 13);

          // Calculate and show nearby properties
          if (properties) {
            const propertiesWithDistance = properties
              .map(prop => {
                if (prop.latitude && prop.longitude) {
                  const distance = calculateDistance(
                    latitude,
                    longitude,
                    parseFloat(prop.latitude),
                    parseFloat(prop.longitude)
                  );
                  return { ...prop, distance } as PropertyWithDistance;
                }
                return null;
              })
              .filter((p): p is PropertyWithDistance => p !== null && typeof p.distance === 'number')
              .sort((a, b) => a.distance - b.distance)
              .slice(0, 5);

            setNearbyProperties(propertiesWithDistance);
            setShowNearby(true);

            toast({
              title: "Localização obtida",
              description: `Encontrados ${propertiesWithDistance.length} imóveis próximos`,
            });
          }
        }
      },
      (error) => {
        console.error('Erro de geolocalização:', error.code, error.message);
        
        // Se falhou com alta precisão, tentar sem
        if (highAccuracy) {
          console.log('Tentando novamente sem alta precisão...');
          requestUserLocation(false);
          return;
        }
        
        let errorMessage = "Não foi possível obter sua localização.";
        let errorTitle = "Erro ao obter localização";
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorTitle = "Permissão negada";
            errorMessage = "Por favor, permita o acesso à localização nas configurações do navegador e atualize a página.";
            break;
          case 2: // POSITION_UNAVAILABLE
            errorTitle = "Posição indisponível";
            errorMessage = "Não foi possível determinar sua localização. Verifique se o GPS está ativado.";
            break;
          case 3: // TIMEOUT
            errorTitle = "Tempo esgotado";
            errorMessage = "A solicitação demorou muito. Tente novamente.";
            break;
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
          duration: 8000,
        });
      },
      options
    );
  };

  // Show route to a property
  const showRoute = async (property: Property) => {
    if (!userLocation || !property.latitude || !property.longitude || !mapRef.current) {
      toast({
        title: "Impossível mostrar rota",
        description: "Primeiro obtenha sua localização",
        variant: "destructive",
      });
      return;
    }

    // Clear existing routes
    routeLayersRef.current.forEach(layer => layer.remove());
    routeLayersRef.current = [];

    const propertyLocation: [number, number] = [
      parseFloat(property.latitude),
      parseFloat(property.longitude)
    ];

    try {
      // Fetch real route from OSRM API
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${propertyLocation[1]},${propertyLocation[0]}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) throw new Error('Erro ao buscar rota');
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        const coordinates = routeData.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        
        // Draw the real route with curves
        const route = L.polyline(coordinates, {
          color: '#2563eb',
          weight: 4,
          opacity: 0.7,
        }).addTo(mapRef.current!);

        routeLayersRef.current.push(route);

        // Fit bounds to show both points and the route
        mapRef.current!.fitBounds(route.getBounds(), { padding: [50, 50] });

        setSelectedProperty(property);
        
        const distanceKm = (routeData.distance / 1000).toFixed(2);
        const durationMin = Math.round(routeData.duration / 60);

        toast({
          title: "Rota calculada",
          description: `${distanceKm} km • ${durationMin} min de viagem`,
        });
      } else {
        throw new Error('Nenhuma rota encontrada');
      }
    } catch (error) {
      // Fallback to straight line if route calculation fails
      const route = L.polyline([userLocation, propertyLocation], {
        color: '#2563eb',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(mapRef.current!);

      routeLayersRef.current.push(route);
      mapRef.current!.fitBounds([userLocation, propertyLocation], { padding: [50, 50] });
      setSelectedProperty(property);
      
      const distance = calculateDistance(
        userLocation[0],
        userLocation[1],
        parseFloat(property.latitude),
        parseFloat(property.longitude)
      );

      toast({
        title: "Rota aproximada",
        description: `Distância em linha reta: ${distance.toFixed(2)} km`,
      });
    }
  };

  const clearRoutes = () => {
    routeLayersRef.current.forEach(layer => layer.remove());
    routeLayersRef.current = [];
    setSelectedProperty(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pt-24 pb-12 bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 text-white">
              Explorar Imóveis no Mapa
            </h1>
            <p className="text-xl text-white/80">
              Visualize todos os imóveis disponíveis em Angola
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="space-y-4">
                    <div>
                      <CardTitle>Mapa Interativo</CardTitle>
                      <CardDescription>
                        {properties?.length || 0} imóveis disponíveis
                      </CardDescription>
                    </div>
                    
                    {/* Filtros */}
                    <div className="flex gap-3 flex-wrap">
                      <Select 
                        value={selectedProvincia || "all"} 
                        onValueChange={(value) => {
                          if (value === "all") {
                            setSelectedProvincia("");
                            setSelectedMunicipio("");
                          } else {
                            setSelectedProvincia(value);
                            setSelectedMunicipio("");
                          }
                        }}
                      >
                        <SelectTrigger className="w-[200px]" data-testid="select-provincia">
                          <MapPin className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Todas as Províncias" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as Províncias</SelectItem>
                          {angolaProvinces.map((prov) => (
                            <SelectItem key={prov.name} value={prov.name}>
                              {prov.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select 
                        value={selectedMunicipio || "all"} 
                        onValueChange={(value) => {
                          if (value === "all") {
                            setSelectedMunicipio("");
                          } else {
                            setSelectedMunicipio(value);
                          }
                        }}
                        disabled={!selectedProvincia || selectedProvincia === "all"}
                      >
                        <SelectTrigger className="w-[200px]" data-testid="select-municipio">
                          <MapPin className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Todos os Municípios" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Municípios</SelectItem>
                          {availableMunicipios.map((mun) => (
                            <SelectItem key={mun.name} value={mun.name}>
                              {mun.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {(selectedProvincia || selectedMunicipio) && selectedProvincia !== "all" && selectedMunicipio !== "all" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProvincia("");
                            setSelectedMunicipio("");
                          }}
                          data-testid="button-clear-filters"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Limpar Filtros
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div 
                    ref={mapContainerRef} 
                    className="w-full rounded-md border"
                    style={{ height: '450px', minHeight: '450px', position: 'relative' }}
                    data-testid="map-container"
                  />
                  
                  <div className="mt-4 flex gap-4 flex-wrap text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white"></div>
                      <span>Venda</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                      <span>Arrendamento</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Selected Property */}
              {selectedProperty && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">Imóvel Selecionado</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedProperty(null)}
                          data-testid="button-close-selected"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedProperty.images && selectedProperty.images.length > 0 && (
                        <img 
                          src={selectedProperty.images[0]} 
                          alt={selectedProperty.title}
                          className="w-full h-40 object-cover rounded-md"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold mb-1">{selectedProperty.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {selectedProperty.bairro}, {selectedProperty.municipio}
                        </p>
                        <p className="text-2xl font-bold text-primary mb-3">
                          {formatAOA(selectedProperty.price)}
                        </p>
                        <div className="flex gap-2 mb-4">
                          <Badge variant={selectedProperty.type === 'Vender' ? 'destructive' : 'default'}>
                            {selectedProperty.type === 'Arrendar' ? 'Disponível para arrendar' : selectedProperty.type === 'Vender' ? 'Disponível para compra' : selectedProperty.type}
                          </Badge>
                          <Badge variant="outline">{selectedProperty.category}</Badge>
                        </div>
                        <Button
                          className="w-full"
                          size="sm"
                          asChild
                          data-testid="button-view-details"
                        >
                          <Link href={`/imoveis/${selectedProperty.id}`}>
                            <Home className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Info Card */}
              {!selectedProperty && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Como usar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Visualize imóveis</p>
                        <p className="text-muted-foreground text-xs">
                          Clique nos marcadores no mapa para ver detalhes dos imóveis
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Navigation className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Filtre por localização</p>
                        <p className="text-muted-foreground text-xs">
                          Use os filtros de província e município para encontrar imóveis específicos
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

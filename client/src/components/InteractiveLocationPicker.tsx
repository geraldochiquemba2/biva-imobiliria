import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface InteractiveLocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, isFromGeolocation?: boolean) => void;
}

export default function InteractiveLocationPicker({ 
  latitude, 
  longitude, 
  onLocationChange 
}: InteractiveLocationPickerProps) {
  const { toast } = useToast();
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isGettingLocationRef = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Ensure valid coordinates
    const lat = latitude || -8.8383;
    const lng = longitude || 13.2344;

    const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const marker = L.marker([lat, lng]).addTo(map);
    
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onLocationChange(lat, lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (markerRef.current && mapRef.current && latitude && longitude) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
    }
  }, [latitude, longitude]);

  const getCurrentLocation = () => {
    // Verificar se o site está em HTTPS (necessário para geolocalização em móveis)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      toast({
        title: "HTTPS necessário",
        description: "A geolocalização requer uma conexão segura (HTTPS). Acesse o site via HTTPS.",
        variant: "destructive",
        duration: 8000,
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização",
        variant: "destructive",
      });
      return;
    }

    if (isGettingLocationRef.current) return;
    isGettingLocationRef.current = true;

    toast({
      title: "Obtendo localização...",
      description: "Por favor, permita o acesso à sua localização quando solicitado",
      duration: 3000,
    });

    // Tentar obter localização diretamente (mais compatível com mobile)
    requestLocation();
  };

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (markerRef.current && mapRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
          mapRef.current.setView([latitude, longitude], 15);
          onLocationChange(latitude, longitude, true);
          
          toast({
            title: "Localização obtida",
            description: "Sua localização foi identificada com sucesso",
          });
        }
        
        isGettingLocationRef.current = false;
      },
      (error) => {
        let errorMessage = "Não foi possível obter sua localização";
        let errorTitle = "Erro ao obter localização";
        
        console.error('Erro de geolocalização:', error);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorTitle = "Permissão negada";
            errorMessage = "Você negou o acesso à localização. Para habilitar:\n• Chrome/Edge: Toque no cadeado > Permissões > Localização\n• Safari: Ajustes do iPhone > Safari > Localização";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "GPS indisponível. Verifique se:\n• O GPS está ativado no dispositivo\n• Você está em um local com sinal GPS\n• O navegador tem permissão para acessar localização";
            break;
          case error.TIMEOUT:
            errorMessage = "Tempo limite excedido. Tente novamente em um local com melhor sinal GPS.";
            break;
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
          duration: 10000,
        });
        isGettingLocationRef.current = false;
      },
      {
        enableHighAccuracy: true, // Tentar alta precisão primeiro
        timeout: 20000, // Timeout maior para mobile
        maximumAge: 30000, // Cache de 30 segundos
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Clique no mapa para ajustar a localização exata</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          data-testid="button-get-current-location"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Minha Localização
        </Button>
      </div>
      
      <div 
        ref={mapContainerRef} 
        className="w-full h-96 rounded-md overflow-hidden border"
        data-testid="map-container"
      />
      
      <p className="text-xs text-muted-foreground" data-testid="text-coordinates">
        Coordenadas: {(latitude || 0).toFixed(6)}, {(longitude || 0).toFixed(6)}
      </p>
    </div>
  );
}

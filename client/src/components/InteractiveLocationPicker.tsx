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
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      toast({
        title: "HTTPS necessário",
        description: "A geolocalização requer uma conexão segura (HTTPS). Certifique-se de que o site está hospedado com HTTPS ativado.",
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

    // Primeiro, tente verificar permissões se a API estiver disponível
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          toast({
            title: "Permissão negada",
            description: "Por favor, vá em Configurações do navegador > Permissões de sites > Localização e permita o acesso.",
            variant: "destructive",
            duration: 8000,
          });
          isGettingLocationRef.current = false;
          return;
        }
        requestLocation();
      }).catch(() => {
        // Se a API de permissões não estiver disponível, tente obter localização diretamente
        requestLocation();
      });
    } else {
      requestLocation();
    }
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
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorTitle = "Permissão negada";
            errorMessage = "Para habilitar:\n1. Toque no ícone de cadeado/informações na barra de endereços\n2. Toque em 'Permissões do site'\n3. Ative 'Localização'";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Serviço de localização indisponível. Verifique se o GPS está ativado no seu dispositivo.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tempo limite excedido. Tente novamente.";
            break;
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
          duration: 7000,
        });
        isGettingLocationRef.current = false;
      },
      {
        enableHighAccuracy: false, // Reduzir para false em dispositivos móveis para maior compatibilidade
        timeout: 15000, // Aumentar timeout
        maximumAge: 60000, // Aceitar cache de até 1 minuto
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

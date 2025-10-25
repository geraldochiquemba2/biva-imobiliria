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
  onLocationChange: (lat: number, lng: number) => void;
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

    const map = L.map(mapContainerRef.current).setView([latitude, longitude], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const marker = L.marker([latitude, longitude]).addTo(map);
    
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
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
    }
  }, [latitude, longitude]);

  const getCurrentLocation = () => {
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
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (markerRef.current && mapRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
          mapRef.current.setView([latitude, longitude], 15);
          onLocationChange(latitude, longitude);
        }
        
        toast({
          title: "Localização detectada",
          description: "Marcador atualizado com sua localização atual",
        });
        isGettingLocationRef.current = false;
      },
      (error) => {
        let errorMessage = "Não foi possível obter sua localização";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permissão de localização negada. Por favor, habilite nas configurações do navegador.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informações de localização não estão disponíveis";
            break;
          case error.TIMEOUT:
            errorMessage = "Tempo limite excedido ao obter localização";
            break;
        }
        
        toast({
          title: "Erro ao obter localização",
          description: errorMessage,
          variant: "destructive",
        });
        isGettingLocationRef.current = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
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
        Coordenadas: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </p>
    </div>
  );
}

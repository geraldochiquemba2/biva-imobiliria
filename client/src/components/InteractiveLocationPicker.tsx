import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
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
  onLocationSelect?: (provincia: string, municipio: string) => void;
}

export default function InteractiveLocationPicker({ 
  latitude, 
  longitude, 
  onLocationChange,
  onLocationSelect
}: InteractiveLocationPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Ensure valid coordinates
    const lat = latitude || -8.8383;
    const lng = longitude || 13.2344;

    try {
      const map = L.map(mapContainerRef.current, {
        maxZoom: 17,
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([lat, lng], 13);
      
      // Camada de satélite (Esri World Imagery)
      const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri',
        maxZoom: 19,
        minZoom: 3,
      });

      // Camada de rótulos claros para sobrepor ao satélite
      const labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        minZoom: 3,
      });

      // Criar um grupo de camadas para híbrido (satélite + rótulos)
      const hybridMap = L.layerGroup([satelliteMap, labels]);

      // Adicionar camada padrão (Híbrido)
      hybridMap.addTo(map);

      const marker = L.marker([lat, lng]).addTo(map);
      
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onLocationChange(lat, lng);
        
        if (onLocationSelect) {
          import('@shared/angola-locations').then(({ findClosestLocation }) => {
            const { province, municipality } = findClosestLocation(lat, lng);
            onLocationSelect(province, municipality);
          });
        }
      });

      mapRef.current = map;
      markerRef.current = marker;

      // Force map to resize after delays to ensure proper rendering
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 500);

      return () => {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []);

  useEffect(() => {
    if (markerRef.current && mapRef.current && latitude && longitude) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Clique no mapa para ajustar a localização exata</span>
      </div>
      
      <div 
        ref={mapContainerRef} 
        className="w-full rounded-md border"
        data-testid="map-container"
        style={{ height: '384px', minHeight: '384px', width: '100%', position: 'relative', zIndex: 0 }}
      />
      
      <p className="text-xs text-muted-foreground" data-testid="text-coordinates">
        Coordenadas: {(latitude || 0).toFixed(6)}, {(longitude || 0).toFixed(6)}
      </p>
    </div>
  );
}

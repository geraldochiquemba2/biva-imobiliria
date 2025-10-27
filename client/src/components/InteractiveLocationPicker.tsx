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
}

export default function InteractiveLocationPicker({ 
  latitude, 
  longitude, 
  onLocationChange 
}: InteractiveLocationPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Ensure valid coordinates
    const lat = latitude || -8.8383;
    const lng = longitude || 13.2344;

    console.log('Initializing map with coordinates:', lat, lng);
    console.log('Map container:', mapContainerRef.current);

    try {
      const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
      console.log('Map created successfully');
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
      console.log('Tile layer added');

      const marker = L.marker([lat, lng]).addTo(map);
      console.log('Marker added');
      
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onLocationChange(lat, lng);
      });

      mapRef.current = map;
      markerRef.current = marker;

      // Force map to resize after delays to ensure proper rendering
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
          console.log('Map size invalidated (100ms)');
        }
      }, 100);

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
          console.log('Map size invalidated (500ms)');
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
        style={{ height: '384px', minHeight: '384px', width: '100%', position: 'relative', zIndex: 0, backgroundColor: '#f0f0f0' }}
      />
      
      <p className="text-xs text-muted-foreground" data-testid="text-coordinates">
        Coordenadas: {(latitude || 0).toFixed(6)}, {(longitude || 0).toFixed(6)}
      </p>
    </div>
  );
}

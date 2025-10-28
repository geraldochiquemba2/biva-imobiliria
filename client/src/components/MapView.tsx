import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  latitude: number;
  longitude: number;
  title?: string;
  userLocation?: { lat: number; lng: number } | null;
  onRouteInfo?: (distance: string, duration: string) => void;
}

export default function MapView({ latitude, longitude, title, userLocation, onRouteInfo }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const propertyMarkerRef = useRef<L.Marker | null>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initAttempts = useRef<number>(0);

  useEffect(() => {
    if (!mapContainerRef.current) {
      console.log('MapView: Container not ready');
      return;
    }

    // Clear any pending initialization
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }

    // Cleanup existing map if any
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {
        console.error('Error removing existing map:', e);
      }
      mapRef.current = null;
    }

    // Wait for DOM to settle before creating new map
    initTimeoutRef.current = setTimeout(() => {
      if (!mapContainerRef.current) {
        console.log('MapView: Container disappeared before initialization');
        return;
      }

      try {
        console.log(`MapView: Initializing map at [${latitude}, ${longitude}]`);
        
        const map = L.map(mapContainerRef.current, {
          center: [latitude, longitude],
          zoom: 15,
          scrollWheelZoom: true,
          zoomControl: true,
        });
        
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
          minZoom: 3
        }).addTo(map);
        
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          minZoom: 3
        }).addTo(map);

        const destinationIcon = L.divIcon({
          html: '<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          className: 'custom-marker'
        });

        const marker = L.marker([latitude, longitude], { icon: destinationIcon }).addTo(map);
        propertyMarkerRef.current = marker;
        
        if (title) {
          marker.bindPopup(`<strong>${title}</strong>`).openPopup();
        }

        mapRef.current = map;
        initAttempts.current = 0;
        console.log('MapView: Map initialized successfully');

        // Force map to recalculate size after tiles load
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
            console.log('MapView: Map size invalidated');
          }
        }, 100);
        
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 500);
      } catch (error) {
        console.error('MapView: Error initializing map:', error);
        initAttempts.current++;
        
        // Retry up to 3 times
        if (initAttempts.current < 3) {
          console.log(`MapView: Retrying initialization (attempt ${initAttempts.current + 1})`);
          setTimeout(() => {
            if (mapContainerRef.current && !mapRef.current) {
              const event = new Event('retry-map-init');
              mapContainerRef.current.dispatchEvent(event);
            }
          }, 500);
        }
      }
    }, 300);

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
    };
  }, [latitude, longitude, title]);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
    }

    const userIcon = L.divIcon({
      html: '<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      className: 'user-marker'
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(mapRef.current);
    userMarker.bindPopup('<strong>Sua localização</strong>');
    userMarkerRef.current = userMarker;

    fetchRoute(userLocation.lat, userLocation.lng, latitude, longitude);
  }, [userLocation, latitude, longitude]);

  const fetchRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) throw new Error('Erro ao buscar rota');
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        
        if (routeLayerRef.current && mapRef.current) {
          mapRef.current.removeLayer(routeLayerRef.current);
        }

        if (mapRef.current) {
          const routeLine = L.polyline(coordinates, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.7
          }).addTo(mapRef.current);
          
          routeLayerRef.current = routeLine;

          const bounds = L.latLngBounds([
            [startLat, startLng],
            [endLat, endLng]
          ]);
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });

          const distanceKm = (route.distance / 1000).toFixed(1);
          const durationMin = Math.round(route.duration / 60);
          
          if (onRouteInfo) {
            onRouteInfo(`${distanceKm} km`, `${durationMin} min`);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao traçar rota:', error);
    }
  };

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full rounded-md border relative"
      style={{ height: '400px', minHeight: '400px' }}
      data-testid="map-view"
    />
  );
}

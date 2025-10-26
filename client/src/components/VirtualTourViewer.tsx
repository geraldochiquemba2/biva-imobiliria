import { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, ChevronLeft, ChevronRight } from "lucide-react";
import type { VirtualTourWithRooms, TourRoom } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";

interface VirtualTourViewerProps {
  tour: VirtualTourWithRooms;
}

export default function VirtualTourViewer({ tour }: VirtualTourViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentRoom = tour.rooms?.[currentRoomIndex];
  const hasRooms = tour.rooms && tour.rooms.length > 0;

  useEffect(() => {
    if (!containerRef.current || !hasRooms || !currentRoom) return;

    const viewer = new Viewer({
      container: containerRef.current,
      panorama: currentRoom.image,
      plugins: [[MarkersPlugin, {}]],
      navbar: [
        "zoom",
        "moveUp",
        "moveDown",
        "moveLeft",
        "moveRight",
        {
          id: "custom-fullscreen",
          content: isFullscreen ? "Sair da tela cheia" : "Tela cheia",
          onClick: toggleFullscreen,
        },
      ],
      defaultYaw: 0,
      defaultPitch: 0,
      minFov: 30,
      maxFov: 90,
    });

    viewerRef.current = viewer;

    const markersPlugin = viewer.getPlugin(MarkersPlugin);

    viewer.addEventListener("ready", () => {
      setIsLoading(false);

      if (currentRoom.hotspotsFrom && currentRoom.hotspotsFrom.length > 0) {
        currentRoom.hotspotsFrom.forEach((hotspot) => {
          const targetRoom = tour.rooms?.find((r) => r.id === hotspot.toRoomId);
          if (!targetRoom) return;

          markersPlugin.addMarker({
            id: hotspot.id,
            position: {
              yaw: parseFloat(hotspot.yaw),
              pitch: parseFloat(hotspot.pitch),
            },
            image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' stroke='%23000' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 8v8m-4-4h8'/%3E%3C/svg%3E",
            size: { width: 32, height: 32 },
            tooltip: hotspot.label || `Ir para ${targetRoom.name}`,
            data: {
              targetRoomId: hotspot.toRoomId,
            },
          });
        });
      }
    });

    markersPlugin.addEventListener("select-marker", (e: any) => {
      const targetRoomId = e.marker.data?.targetRoomId;
      if (targetRoomId) {
        const targetIndex = tour.rooms?.findIndex((r) => r.id === targetRoomId);
        if (targetIndex !== undefined && targetIndex !== -1) {
          navigateToRoom(targetIndex);
        }
      }
    });

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [currentRoom, hasRooms]);

  const navigateToRoom = (index: number) => {
    if (index >= 0 && index < (tour.rooms?.length || 0)) {
      setIsLoading(true);
      setCurrentRoomIndex(index);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (!hasRooms) {
    return (
      <Card data-testid="card-no-tour">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Tour virtual não disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="container-virtual-tour">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-tour-name">
            {tour.name}
          </h3>
          {currentRoom && (
            <p className="text-sm text-muted-foreground" data-testid="text-current-room">
              {currentRoom.name} ({currentRoomIndex + 1} de {tour.rooms?.length})
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToRoom(currentRoomIndex - 1)}
            disabled={currentRoomIndex === 0 || isLoading}
            data-testid="button-previous-room"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToRoom(currentRoomIndex + 1)}
            disabled={currentRoomIndex >= (tour.rooms?.length || 1) - 1 || isLoading}
            data-testid="button-next-room"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            data-testid="button-fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full h-[500px] rounded-lg overflow-hidden bg-muted relative"
        data-testid="viewer-container"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        )}
      </div>

      {tour.rooms && tour.rooms.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {tour.rooms.map((room, index) => (
            <Button
              key={room.id}
              variant={index === currentRoomIndex ? "default" : "outline"}
              size="sm"
              onClick={() => navigateToRoom(index)}
              disabled={isLoading}
              data-testid={`button-room-${room.id}`}
            >
              {room.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

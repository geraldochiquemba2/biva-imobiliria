import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { VirtualTourWithRooms, TourRoom, Property } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TourVirtualManager() {
  const [, params] = useRoute("/imoveis/:propertyId/tour-virtual");
  const propertyId = params?.propertyId;
  const { toast } = useToast();
  const [tourName, setTourName] = useState("");
  const [tourDescription, setTourDescription] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [editingRoom, setEditingRoom] = useState<TourRoom | null>(null);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);

  const { data: tour, isLoading } = useQuery<VirtualTourWithRooms>({
    queryKey: ["/api/virtual-tours/property", propertyId],
    enabled: !!propertyId,
  });

  const { data: property } = useQuery<Property>({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !!propertyId,
  });

  const createTourMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return await apiRequest("POST", `/api/virtual-tours`, {
        propertyId,
        name: data.name,
        description: data.description || null,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/virtual-tours/property", propertyId], refetchType: 'active' }),
      ]);
      toast({ title: "Tour virtual criado com sucesso!" });
      setTourName("");
      setTourDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar tour virtual",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addRoomMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await fetch(`/api/virtual-tours/${tour?.id}/rooms`, {
        method: "POST",
        body: formData,
      }).then((res) => {
        if (!res.ok) throw new Error("Falha ao adicionar cômodo");
        return res.json();
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/virtual-tours/property", propertyId], refetchType: 'active' }),
      ]);
      toast({ title: "Cômodo adicionado com sucesso!" });
      setRoomName("");
      setRoomImage(null);
      setIsAddRoomDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar cômodo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      return await apiRequest("DELETE", `/api/tour-rooms/${roomId}`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/virtual-tours/property", propertyId], refetchType: 'active' }),
      ]);
      toast({ title: "Cômodo removido com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover cômodo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o tour virtual",
        variant: "destructive",
      });
      return;
    }
    createTourMutation.mutate({ name: tourName, description: tourDescription });
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !roomImage) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e selecione uma imagem 360°",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", roomName);
    formData.append("image", roomImage);
    formData.append("orderIndex", String(tour?.rooms?.length || 0));

    addRoomMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6" data-testid="loading-tour-manager">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <Link href={`/imoveis/${propertyId}`}>
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o imóvel
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          Gerenciar Tour Virtual
        </h1>
        {property && (
          <p className="text-muted-foreground" data-testid="text-property-title">
            {property.title}
          </p>
        )}
      </div>

      {!tour ? (
        <Card data-testid="card-create-tour">
          <CardHeader>
            <CardTitle>Criar Tour Virtual 360°</CardTitle>
            <CardDescription>
              Crie um tour virtual interativo para mostrar seu imóvel em 360°
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTour} className="space-y-4">
              <div>
                <Label htmlFor="tour-name">Nome do Tour *</Label>
                <Input
                  id="tour-name"
                  value={tourName}
                  onChange={(e) => setTourName(e.target.value)}
                  placeholder="Ex: Tour Completo do Apartamento"
                  data-testid="input-tour-name"
                />
              </div>
              <div>
                <Label htmlFor="tour-description">Descrição (opcional)</Label>
                <Textarea
                  id="tour-description"
                  value={tourDescription}
                  onChange={(e) => setTourDescription(e.target.value)}
                  placeholder="Descreva o tour virtual..."
                  rows={3}
                  data-testid="input-tour-description"
                />
              </div>
              <Button type="submit" disabled={createTourMutation.isPending} data-testid="button-create-tour">
                {createTourMutation.isPending ? "Criando..." : "Criar Tour Virtual"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card data-testid="card-tour-info">
            <CardHeader>
              <CardTitle>{tour.name}</CardTitle>
              {tour.description && <CardDescription>{tour.description}</CardDescription>}
            </CardHeader>
          </Card>

          <Card data-testid="card-rooms">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cômodos do Tour</CardTitle>
                  <CardDescription>
                    Adicione fotos 360° dos diferentes cômodos do imóvel
                  </CardDescription>
                </div>
                <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-room">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Cômodo
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-add-room">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Cômodo</DialogTitle>
                      <DialogDescription>
                        Faça upload de uma foto 360° e nomeie o cômodo
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddRoom} className="space-y-4">
                      <div>
                        <Label htmlFor="room-name">Nome do Cômodo *</Label>
                        <Input
                          id="room-name"
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          placeholder="Ex: Sala de Estar"
                          data-testid="input-room-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="room-image">Imagem 360° *</Label>
                        <Input
                          id="room-image"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setRoomImage(e.target.files?.[0] || null)}
                          data-testid="input-room-image"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Faça upload de uma foto 360° ou panorâmica (JPG, PNG ou WebP)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={addRoomMutation.isPending}
                          data-testid="button-submit-room"
                        >
                          {addRoomMutation.isPending ? "Adicionando..." : "Adicionar"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddRoomDialogOpen(false)}
                          data-testid="button-cancel-add-room"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {!tour.rooms || tour.rooms.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground" data-testid="text-no-rooms">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum cômodo adicionado ainda</p>
                  <p className="text-sm">Comece adicionando fotos 360° dos cômodos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tour.rooms.map((room, index) => (
                    <Card key={room.id} className="overflow-hidden" data-testid={`card-room-${room.id}`}>
                      <div className="aspect-video bg-muted relative">
                        <img
                          src={room.image}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2" data-testid={`text-room-name-${room.id}`}>
                          {room.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {room.hotspotsFrom?.length || 0} hotspot(s)
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRoomMutation.mutate(room.id)}
                            disabled={deleteRoomMutation.isPending}
                            data-testid={`button-delete-room-${room.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {tour.rooms && tour.rooms.length > 0 && (
            <Card data-testid="card-preview">
              <CardHeader>
                <CardTitle>Preview do Tour</CardTitle>
                <CardDescription>
                  Visualize como ficará o tour virtual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/imoveis/${propertyId}`}>
                  <Button variant="outline" data-testid="button-view-tour">
                    Ver Tour na Página do Imóvel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

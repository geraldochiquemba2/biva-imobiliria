import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Advertisement } from "@shared/schema";

interface AdvertisementFormData {
  title: string;
  description: string;
  link: string;
  active: boolean;
  orderIndex: number;
  image?: File | string;
}

export default function AdminAnuncios() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState<AdvertisementFormData>({
    title: "",
    description: "",
    link: "",
    active: true,
    orderIndex: 0
  });
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: advertisements, isLoading } = useQuery<Advertisement[]>({
    queryKey: ['/api/advertisements/all'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/advertisements', {
        method: 'POST',
        body: data,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create advertisement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/all'] });
      toast({
        title: "Anúncio criado",
        description: "O anúncio foi criado com sucesso.",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar anúncio.",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await fetch(`/api/advertisements/${id}`, {
        method: 'PATCH',
        body: data,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update advertisement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/all'] });
      toast({
        title: "Anúncio atualizado",
        description: "O anúncio foi atualizado com sucesso.",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar anúncio.",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/advertisements/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete advertisement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/all'] });
      toast({
        title: "Anúncio deletado",
        description: "O anúncio foi deletado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao deletar anúncio.",
        variant: "destructive",
      });
    }
  });

  const handleOpenDialog = (ad?: Advertisement) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        title: ad.title,
        description: ad.description || "",
        link: ad.link || "",
        active: ad.active || false,
        orderIndex: ad.orderIndex || 0
      });
      setImagePreview(ad.image);
    } else {
      setEditingAd(null);
      setFormData({
        title: "",
        description: "",
        link: "",
        active: true,
        orderIndex: 0
      });
      setImagePreview("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAd(null);
    setFormData({
      title: "",
      description: "",
      link: "",
      active: true,
      orderIndex: 0
    });
    setImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('link', formData.link);
    data.append('active', formData.active.toString());
    data.append('orderIndex', formData.orderIndex.toString());
    
    if (formData.image instanceof File) {
      data.append('image', formData.image);
    }

    if (editingAd) {
      updateMutation.mutate({ id: editingAd.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este anúncio?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciar Anúncios</h1>
            <p className="text-muted-foreground">
              Adicione e gerencie banners de publicidade para a página inicial
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} data-testid="button-add-advertisement">
            <Plus className="h-4 w-4 mr-2" />
            Novo Anúncio
          </Button>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : advertisements && advertisements.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advertisements.map((ad) => (
              <Card key={ad.id} className="overflow-hidden" data-testid={`ad-card-${ad.id}`}>
                <div className="relative h-48">
                  <img
                    src={ad.image}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      ad.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                    }`}>
                      {ad.active ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-1 truncate" data-testid={`ad-title-${ad.id}`}>{ad.title}</h3>
                  {ad.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {ad.description}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground mb-3">
                    Ordem: {ad.orderIndex}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(ad)}
                      className="flex-1"
                      data-testid={`button-edit-${ad.id}`}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(ad.id)}
                      className="flex-1"
                      data-testid={`button-delete-${ad.id}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum anúncio criado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro anúncio para aparecer na página inicial
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Anúncio
            </Button>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-advertisement-form">
            <DialogHeader>
              <DialogTitle>
                {editingAd ? 'Editar Anúncio' : 'Novo Anúncio'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="input-ad-title"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  data-testid="input-ad-description"
                />
              </div>

              <div>
                <Label htmlFor="link">Link (URL)</Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://exemplo.com"
                  data-testid="input-ad-link"
                />
              </div>

              <div>
                <Label htmlFor="orderIndex">Ordem de Exibição</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                  data-testid="input-ad-order"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  data-testid="switch-ad-active"
                />
                <Label htmlFor="active">Anúncio Ativo</Label>
              </div>

              <div>
                <Label htmlFor="image">Imagem {!editingAd && '*'}</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  required={!editingAd}
                  data-testid="input-ad-image"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-md"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : editingAd
                    ? "Atualizar"
                    : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

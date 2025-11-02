import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Advertisement } from "@shared/schema";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  const contacts = [
    {
      icon: Phone,
      title: "Telefone",
      info: "+244 923 456 789",
      description: "Seg - Sex, 8h às 18h",
      gradient: "bg-gradient-to-br from-blue-500/10 to-blue-600/20"
    },
    {
      icon: Mail,
      title: "Email",
      info: "contacto@biva.ao",
      description: "Respondemos em 24h",
      gradient: "bg-gradient-to-br from-green-500/10 to-green-600/20"
    },
    {
      icon: MapPin,
      title: "Localização",
      info: "Luanda, Angola",
      description: "Talatona, Rua Principal",
      gradient: "bg-gradient-to-br from-purple-500/10 to-purple-600/20"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-contact">
        <DialogHeader>
          <DialogTitle className="text-2xl">Entre em Contacto</DialogTitle>
          <DialogDescription>
            Quer anunciar no BIVA? Entre em contacto connosco através dos seguintes meios:
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {contacts.map((contact, index) => (
            <Card key={contact.title} className={`p-6 text-center relative overflow-hidden ${contact.gradient}`} data-testid={`contact-card-${index}`}>
              <div className="w-16 h-16 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
                <contact.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{contact.title}</h3>
              <p className="text-sm font-medium mb-1" data-testid={`contact-info-${index}`}>{contact.info}</p>
              <p className="text-xs text-muted-foreground">{contact.description}</p>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-md">
          <p className="text-sm text-center">
            <strong>Horário de Atendimento:</strong> Segunda a Sexta, das 8h às 18h
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdvertisementBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  const { data: advertisements, isLoading } = useQuery<Advertisement[]>({
    queryKey: ['/api/advertisements'],
  });

  const activeAds = advertisements?.filter(ad => ad.active) || [];

  const nextSlide = () => {
    if (activeAds.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }
  };

  const prevSlide = () => {
    if (activeAds.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + activeAds.length) % activeAds.length);
    }
  };

  // Pré-carregar imagens
  useEffect(() => {
    if (activeAds.length === 0) return;

    activeAds.forEach(ad => {
      const img = new Image();
      img.src = ad.image;
    });
  }, [activeAds]);

  // Carrossel automático
  useEffect(() => {
    if (activeAds.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeAds.length, currentIndex]);

  if (isLoading) {
    return (
      <div className="w-full py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <Card className="h-64 animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  if (!activeAds || activeAds.length === 0) {
    return null;
  }

  const currentAd = activeAds[currentIndex];

  return (
    <>
      <div className="w-full py-12 px-6 bg-muted/30" data-testid="advertisement-banner">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Publicidade</h2>
            <Button 
              onClick={() => setContactDialogOpen(true)}
              variant="default"
              data-testid="button-advertise-here"
            >
              <Phone className="h-4 w-4 mr-2" />
              Quer Anunciar? Clique Aqui
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {activeAds.length > 1 && (
              <button
                onClick={prevSlide}
                className="w-12 h-12 rounded-full bg-card border hover-elevate active-elevate-2 flex items-center justify-center transition-all"
                data-testid="button-prev-ad"
                aria-label="Anúncio anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <Card className="overflow-hidden flex-1">
              <div className="p-4 border-b min-h-[100px] bg-background relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-lg font-bold mb-1 line-clamp-1" data-testid={`ad-title-${currentIndex}`}>
                      {currentAd.title}
                    </h3>
                    {currentAd.description && (
                      <p className="text-muted-foreground text-sm mb-2 line-clamp-2" data-testid={`ad-description-${currentIndex}`}>
                        {currentAd.description}
                      </p>
                    )}
                    {currentAd.link && (
                      <a 
                        href={currentAd.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        data-testid={`ad-visit-button-${currentIndex}`}
                      >
                        <Button 
                          variant="default"
                          size="sm"
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Visitar
                        </Button>
                      </a>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative w-full aspect-square overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    {/* Background desfocado */}
                    <img
                      src={currentAd.image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
                      loading="lazy"
                      aria-hidden="true"
                    />
                    {/* Imagem principal */}
                    <img
                      src={currentAd.image}
                      alt={currentAd.title}
                      className="relative w-full h-full object-contain z-10"
                      loading="lazy"
                    />
                  </motion.div>
                </AnimatePresence>

                {activeAds.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {activeAds.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentIndex 
                            ? 'bg-white w-8' 
                            : 'bg-white/50 hover:bg-white/70'
                        }`}
                        data-testid={`ad-indicator-${index}`}
                        aria-label={`Ir para anúncio ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {activeAds.length > 1 && (
              <button
                onClick={nextSlide}
                className="w-12 h-12 rounded-full bg-card border hover-elevate active-elevate-2 flex items-center justify-center transition-all"
                data-testid="button-next-ad"
                aria-label="Próximo anúncio"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      <ContactDialog open={contactDialogOpen} onOpenChange={setContactDialogOpen} />
    </>
  );
}

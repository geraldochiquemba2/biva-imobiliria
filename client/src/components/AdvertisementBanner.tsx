import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Phone } from "lucide-react";
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
      description: "Seg - Sex, 8h às 18h"
    },
    {
      icon: "✉️",
      title: "Email",
      info: "contacto@biva.ao",
      description: "Respondemos em 24h"
    },
    {
      icon: "📍",
      title: "Localização",
      info: "Luanda, Angola",
      description: "Talatona, Rua Principal"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-contact">
        <DialogHeader>
          <DialogTitle className="text-2xl">Entre em Contacto</DialogTitle>
          <DialogDescription>
            Quer anunciar no BIVA? Entre em contacto connosco através dos seguintes meios:
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {contacts.map((contact, index) => (
            <Card key={contact.title} className="p-6 text-center" data-testid={`contact-card-${index}`}>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                {typeof contact.icon === 'string' ? (
                  <span className="text-2xl">{contact.icon}</span>
                ) : (
                  <contact.icon className="h-6 w-6 text-primary" />
                )}
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

          <div className="relative">
            <Card className="overflow-hidden">
              <div className="relative h-64 md:h-80 lg:h-96">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    {currentAd.link ? (
                      <a 
                        href={currentAd.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block h-full"
                        data-testid={`ad-link-${currentIndex}`}
                      >
                        <img
                          src={currentAd.image}
                          alt={currentAd.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                          <h3 className="text-white text-xl font-bold mb-2" data-testid={`ad-title-${currentIndex}`}>
                            {currentAd.title}
                          </h3>
                          {currentAd.description && (
                            <p className="text-white/90 text-sm" data-testid={`ad-description-${currentIndex}`}>
                              {currentAd.description}
                            </p>
                          )}
                        </div>
                      </a>
                    ) : (
                      <div className="h-full">
                        <img
                          src={currentAd.image}
                          alt={currentAd.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                          <h3 className="text-white text-xl font-bold mb-2" data-testid={`ad-title-${currentIndex}`}>
                            {currentAd.title}
                          </h3>
                          {currentAd.description && (
                            <p className="text-white/90 text-sm" data-testid={`ad-description-${currentIndex}`}>
                              {currentAd.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {activeAds.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover-elevate active-elevate-2 flex items-center justify-center transition-all z-10"
                      data-testid="button-prev-ad"
                      aria-label="Anúncio anterior"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover-elevate active-elevate-2 flex items-center justify-center transition-all z-10"
                      data-testid="button-next-ad"
                      aria-label="Próximo anúncio"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>

                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
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
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ContactDialog open={contactDialogOpen} onOpenChange={setContactDialogOpen} />
    </>
  );
}

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import bgImage from '@assets/stock_images/contact_us_customer__7ca08ad4.jpg';
import phoneImg from '@assets/stock_images/phone_call_customer__d0afec8c.jpg';
import emailImg from '@assets/stock_images/email_envelope_messa_22f5584e.jpg';
import locationImg from '@assets/stock_images/office_building_loca_47ac5ee4.jpg';

export default function Contacto() {
  const contacts = [
    {
      icon: Phone,
      title: "Telefone",
      info: "+244 929 876 560",
      description: "Seg - Sex, 8h às 18h",
      image: phoneImg
    },
    {
      icon: Mail,
      title: "Email",
      info: "geral.biva@gmail.com",
      description: "Respondemos em 24h",
      image: emailImg
    },
    {
      icon: MapPin,
      title: "Localização",
      info: "Camama, Luanda",
      description: "Condominio Pelicano, Rua C",
      image: locationImg
    }
  ];

  return (
    <div className="min-h-screen pt-24">
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/75" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Entre em Contacto
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Estamos aqui para ajudar. Fale connosco!
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {contacts.map((contact, index) => (
              <motion.div
                key={contact.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="relative p-6 h-full hover-elevate transition-all duration-300 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${contact.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/65 to-black/75" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20">
                      <contact.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">{contact.title}</h3>
                    <p className="font-medium mb-1 text-white">{contact.info}</p>
                    <p className="text-sm text-white/80">{contact.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Envie-nos uma Mensagem</h2>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome</label>
                    <Input placeholder="Seu nome" data-testid="input-name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input type="email" placeholder="seu@email.com" data-testid="input-email" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Assunto</label>
                  <Input placeholder="Como podemos ajudar?" data-testid="input-subject" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mensagem</label>
                  <Textarea 
                    placeholder="Escreva sua mensagem aqui..." 
                    rows={6}
                    data-testid="input-message"
                  />
                </div>
                <Button size="lg" className="w-full" data-testid="button-send">
                  <Send className="h-5 w-5 mr-2" />
                  Enviar Mensagem
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Target, Eye, Award, Users, Phone, Mail, MapPin } from "lucide-react";
import bgImage from '@assets/stock_images/business_team_office_7840ab22.jpg';
import targetImg from '@assets/stock_images/target_goal_achievem_fa0f4f86.jpg';
import visionImg from '@assets/stock_images/vision_future_telesc_51bb093f.jpg';
import awardImg from '@assets/stock_images/award_trophy_excelle_5cd7a8dd.jpg';
import teamImg from '@assets/stock_images/business_team_collab_38b88751.jpg';
import phoneImg from '@assets/stock_images/phone_call_customer__d0afec8c.jpg';
import emailImg from '@assets/stock_images/email_envelope_messa_22f5584e.jpg';
import locationImg from '@assets/stock_images/office_building_loca_47ac5ee4.jpg';

export default function Sobre() {
  const values = [
    {
      icon: Target,
      title: "Missão",
      description: "Simplificar e modernizar o mercado imobiliário em Angola através de tecnologia inovadora",
      image: targetImg
    },
    {
      icon: Eye,
      title: "Visão",
      description: "Ser a plataforma imobiliária de referência em Angola e expandir para toda a África Austral",
      image: visionImg
    },
    {
      icon: Award,
      title: "Valores",
      description: "Transparência, inovação, confiança e compromisso com a excelência",
      image: awardImg
    },
    {
      icon: Users,
      title: "Equipe",
      description: "Profissionais experientes dedicados a transformar o setor imobiliário",
      image: teamImg
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
              Sobre a Biva
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              A plataforma imobiliária mais completa de Angola
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Quem Somos</h2>
            <p className="text-lg text-muted-foreground mb-4">
              A Biva é a plataforma imobiliária digital líder em Angola, conectando proprietários, 
              inquilinos, compradores e corretores em um único ecossistema integrado.
            </p>
            <p className="text-lg text-muted-foreground">
              Nossa missão é transformar o mercado imobiliário angolano através da tecnologia, 
              proporcionando uma experiência moderna, segura e eficiente para todos os envolvidos.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {values.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="relative p-6 h-full hover-elevate transition-all duration-300 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/65 to-black/75" />
                  
                  <div className="relative z-10 flex flex-col">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20">
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                    <p className="text-white/90">{item.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Entre em Contacto</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
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
              ].map((contact, index) => (
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
          </motion.div>
        </div>
      </section>
    </div>
  );
}

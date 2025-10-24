import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Target, Eye, Award, Users } from "lucide-react";
import bgImage from '@assets/stock_images/business_team_office_7840ab22.jpg';

export default function Sobre() {
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
              Sobre a BIVA
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
              A BIVA é a plataforma imobiliária digital líder em Angola, conectando proprietários, 
              inquilinos, compradores e corretores em um único ecossistema integrado.
            </p>
            <p className="text-lg text-muted-foreground">
              Nossa missão é transformar o mercado imobiliário angolano através da tecnologia, 
              proporcionando uma experiência moderna, segura e eficiente para todos os envolvidos.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {[
              {
                icon: Target,
                title: "Missão",
                description: "Simplificar e modernizar o mercado imobiliário em Angola através de tecnologia inovadora"
              },
              {
                icon: Eye,
                title: "Visão",
                description: "Ser a plataforma imobiliária de referência em Angola e expandir para toda a África Austral"
              },
              {
                icon: Award,
                title: "Valores",
                description: "Transparência, inovação, confiança e compromisso com a excelência"
              },
              {
                icon: Users,
                title: "Equipe",
                description: "Profissionais experientes dedicados a transformar o setor imobiliário"
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover-elevate transition-all duration-300">
                  <div className="flex flex-col">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

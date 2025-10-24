import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { FileText, Users, Key, Calculator, Shield, Briefcase } from "lucide-react";
import bgImage from '@assets/stock_images/professional_real_es_55b8b0d5.jpg';

const services = [
  {
    icon: FileText,
    title: "Gestão de Contratos",
    description: "Elaboração e gestão completa de contratos de compra, venda e arrendamento"
  },
  {
    icon: Users,
    title: "Consultoria Imobiliária",
    description: "Orientação especializada para compra, venda e investimento em imóveis"
  },
  {
    icon: Key,
    title: "Intermediação",
    description: "Conectamos compradores e vendedores com total segurança e transparência"
  },
  {
    icon: Calculator,
    title: "Avaliação de Imóveis",
    description: "Avaliação profissional para determinar o valor justo do seu imóvel"
  },
  {
    icon: Shield,
    title: "Assessoria Jurídica",
    description: "Suporte jurídico completo em todas as transações imobiliárias"
  },
  {
    icon: Briefcase,
    title: "Gestão de Propriedades",
    description: "Administração completa de imóveis para proprietários e investidores"
  }
];

export default function Servicos() {
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
              Nossos Serviços
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Soluções completas para todas as suas necessidades imobiliárias em Angola
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O Que Oferecemos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Serviços profissionais com qualidade e confiança
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover-elevate transition-all duration-300">
                  <div className="flex flex-col">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <service.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
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

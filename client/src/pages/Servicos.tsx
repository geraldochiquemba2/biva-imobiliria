import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { FileText, Users, Key, Calculator, Shield, Briefcase } from "lucide-react";
import bgImage from '@assets/stock_images/professional_real_es_55b8b0d5.jpg';
import contractImg from '@assets/stock_images/legal_contract_docum_6462e5a6.jpg';
import consultingImg from '@assets/stock_images/business_consulting__24e49a72.jpg';
import handshakeImg from '@assets/stock_images/handshake_business_d_735d487f.jpg';
import valuationImg from '@assets/stock_images/house_valuation_appr_1a6c58da.jpg';
import legalImg from '@assets/stock_images/lawyer_legal_advice__8d38885f.jpg';
import managementImg from '@assets/stock_images/property_management__eb571a95.jpg';

const services = [
  {
    icon: FileText,
    title: "Gestão de Contratos",
    description: "Elaboração e gestão completa de contratos de compra, venda e arrendamento",
    image: contractImg
  },
  {
    icon: Users,
    title: "Consultoria Imobiliária",
    description: "Orientação especializada para compra, venda e investimento em imóveis",
    image: consultingImg
  },
  {
    icon: Key,
    title: "Intermediação",
    description: "Conectamos compradores e vendedores com total segurança e transparência",
    image: handshakeImg
  },
  {
    icon: Calculator,
    title: "Avaliação de Imóveis",
    description: "Avaliação profissional para determinar o valor justo do seu imóvel",
    image: valuationImg
  },
  {
    icon: Shield,
    title: "Assessoria Jurídica",
    description: "Suporte jurídico completo em todas as transações imobiliárias",
    image: legalImg
  },
  {
    icon: Briefcase,
    title: "Gestão de Propriedades",
    description: "Administração completa de imóveis para proprietários e investidores",
    image: managementImg
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
                <Card className="relative p-6 h-full hover-elevate transition-all duration-300 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${service.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/65 to-black/75" />
                  
                  <div className="relative z-10 flex flex-col">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20">
                      <service.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">{service.title}</h3>
                    <p className="text-white/90">{service.description}</p>
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

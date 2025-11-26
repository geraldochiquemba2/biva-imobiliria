import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building, Search, ArrowRight } from "lucide-react";
import { Link } from "wouter";

import brokerImage from '@assets/stock_images/real_estate_agent_br_95364baa.jpg';
import clientImage from '@assets/stock_images/happy_family_couple__8a6ad2d5.jpg';

export default function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para Começar?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Junte-se a milhares de usuários que confiam na BIVA para suas necessidades imobiliárias
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="relative p-8 h-full hover-elevate transition-all duration-300 flex flex-col overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${brokerImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/60" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/10">
                  <Building className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-white">
                  Para Proprietários & Corretores
                </h3>
                
                <p className="text-white/90 mb-6 flex-grow">
                  Cadastre suas propriedades, gerencie contratos e alcance milhares de potenciais clientes
                </p>

                <Button size="lg" className="w-full group bg-primary border-primary" data-testid="button-register-owner" asChild>
                  <Link to="/cadastro">
                    Cadastre-se Agora
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="relative p-8 h-full hover-elevate transition-all duration-300 flex flex-col overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${clientImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/60" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/10">
                  <Search className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-white">
                  Para Clientes
                </h3>
                
                <p className="text-white/90 mb-6 flex-grow">
                  Encontre o imóvel dos seus sonhos com nossa plataforma intuitiva e busca avançada
                </p>

                <Button size="lg" variant="outline" className="w-full group bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20" data-testid="button-find-property" asChild>
                  <Link to="/explorar-mapa">
                    Encontre seu Imóvel
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

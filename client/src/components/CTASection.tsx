import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building, Search, ArrowRight } from "lucide-react";

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
            <Card className="p-8 h-full hover-elevate transition-all duration-300 flex flex-col">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Building className="h-8 w-8 text-primary" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4">
                Para Proprietários & Corretores
              </h3>
              
              <p className="text-muted-foreground mb-6 flex-grow">
                Cadastre suas propriedades, gerencie contratos e alcance milhares de potenciais clientes
              </p>

              <Button size="lg" className="w-full group" data-testid="button-register-owner">
                Cadastre-se Agora
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-8 h-full hover-elevate transition-all duration-300 flex flex-col">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Search className="h-8 w-8 text-primary" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4">
                Para Clientes
              </h3>
              
              <p className="text-muted-foreground mb-6 flex-grow">
                Encontre o imóvel dos seus sonhos com nossa plataforma intuitiva e busca avançada
              </p>

              <Button size="lg" variant="outline" className="w-full group" data-testid="button-find-property">
                Encontre seu Imóvel
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Home, Map, Calendar, MessageCircle, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Busca Avançada",
    description: "Encontre imóveis por localização, preço, tipo e características específicas."
  },
  {
    icon: Home,
    title: "Gestão de Imóveis",
    description: "Adicione e gerencie seus imóveis de forma simples e eficiente."
  },
  {
    icon: Map,
    title: "Mapas Interativos",
    description: "Visualize a localização exata dos imóveis em mapas interativos."
  },
  {
    icon: Calendar,
    title: "Agendamento de Visitas",
    description: "Agende visitas aos imóveis diretamente pela plataforma."
  },
  {
    icon: MessageCircle,
    title: "Comunicação Direta",
    description: "Entre em contato direto com proprietários e corretores."
  },
  {
    icon: BarChart3,
    title: "Estatísticas",
    description: "Acompanhe visualizações e interesse nos seus imóveis."
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que Você Precisa
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ferramentas completas para encontrar ou anunciar imóveis em Angola
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover-elevate transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

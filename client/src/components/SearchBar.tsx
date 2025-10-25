
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SearchBar() {
  const [, setLocation] = useLocation();

  const handleSearch = () => {
    setLocation('/imoveis');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.9 }}
      className="relative z-20 px-6 py-12"
    >
      <Card className="max-w-5xl mx-auto p-8 shadow-2xl">
        <div className="space-y-4">
          <Button 
            onClick={handleSearch} 
            className="w-full" 
            size="default"
            data-testid="button-search"
          >
            <Search className="h-5 w-5 mr-2" />
            Pesquisar Imóveis
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            Pesquise entre milhares de imóveis em toda Angola
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

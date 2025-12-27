import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function IntroSection() {
  return (
    <section className="py-16 px-6 bg-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative h-[500px] overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-[45%] h-[55%] rounded-2xl overflow-hidden shadow-2xl z-10 transform -rotate-3">
            <img
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80"
              alt="Edifício moderno"
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
            />
          </div>
          
          <div className="absolute top-[15%] right-0 w-[55%] h-[50%] rounded-2xl overflow-hidden shadow-2xl z-20 transform rotate-2">
            <img
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=700&q=80"
              alt="Piscina de luxo"
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
            />
          </div>
          
          <div className="absolute bottom-0 left-[20%] w-[50%] h-[55%] rounded-2xl overflow-hidden shadow-2xl z-30 transform rotate-1">
            <img
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80"
              alt="Interior luxuoso"
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { memo } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();

  return (
    <motion.div
      key={location}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.2,
        ease: "easeOut"
      }}
      style={{ minHeight: "100vh" }}
    >
      {children}
    </motion.div>
  );
}

export default memo(PageTransition);


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

  return null;
}

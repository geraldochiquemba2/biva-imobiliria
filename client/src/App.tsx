import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Home from "@/pages/Home";
import Imoveis from "@/pages/Imoveis";
import Servicos from "@/pages/Servicos";
import Sobre from "@/pages/Sobre";
import Contacto from "@/pages/Contacto";
import Login from "@/pages/Login";
import Cadastro from "@/pages/Cadastro";
import Dashboard from "@/pages/Dashboard";
import CadastrarImovel from "@/pages/CadastrarImovel";
import Profile from "@/pages/Profile";
import ContratosAtivos from "@/pages/ContratosAtivos";
import VisitasAgendadas from "@/pages/VisitasAgendadas";
import ImovelDetalhes from "@/pages/ImovelDetalhes";
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/imoveis" component={Imoveis} />
        <Route path="/imoveis/:id" component={ImovelDetalhes} />
        <Route path="/servicos" component={Servicos} />
        <Route path="/sobre" component={Sobre} />
        <Route path="/contacto" component={Contacto} />
        <Route path="/login" component={Login} />
        <Route path="/cadastro" component={Cadastro} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/cadastrar-imovel" component={CadastrarImovel} />
        <Route path="/perfil" component={Profile} />
        <Route path="/contratos-ativos" component={ContratosAtivos} />
        <Route path="/visitas-agendadas" component={VisitasAgendadas} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Header />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

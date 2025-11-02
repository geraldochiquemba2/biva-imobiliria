import { Switch, Route, useLocation } from "wouter";
import { useEffect, lazy, Suspense, startTransition } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import PageTransition from "@/components/PageTransition";
import { Loader2 } from "lucide-react";

const Home = lazy(() => import("@/pages/Home"));
const Imoveis = lazy(() => import("@/pages/Imoveis"));
const Arrendar = lazy(() => import("@/pages/Arrendar"));
const Comprar = lazy(() => import("@/pages/Comprar"));
const Servicos = lazy(() => import("@/pages/Servicos"));
const Sobre = lazy(() => import("@/pages/Sobre"));
const Contacto = lazy(() => import("@/pages/Contacto"));
const Login = lazy(() => import("@/pages/Login"));
const Cadastro = lazy(() => import("@/pages/Cadastro"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const CadastrarImovel = lazy(() => import("@/pages/CadastrarImovel"));
const Profile = lazy(() => import("@/pages/Profile"));
const ContratosAtivos = lazy(() => import("@/pages/ContratosAtivos"));
const VisitasAgendadas = lazy(() => import("@/pages/VisitasAgendadas"));
const ImovelDetalhes = lazy(() => import("@/pages/ImovelDetalhes"));
const AdminImoveis = lazy(() => import("@/pages/AdminImoveis"));
const AdminAprovarImoveis = lazy(() => import("@/pages/AdminAprovarImoveis"));
const AdminUsuarios = lazy(() => import("@/pages/AdminUsuarios"));
const AdminAnuncios = lazy(() => import("@/pages/AdminAnuncios"));
const MeusImoveis = lazy(() => import("@/pages/MeusImoveis"));
const ImoveisPendentes = lazy(() => import("@/pages/ImoveisPendentes"));
const EditarImovel = lazy(() => import("@/pages/EditarImovel"));
const ImoveisDisponiveis = lazy(() => import("@/pages/ImoveisDisponiveis"));
const ImoveisArrendados = lazy(() => import("@/pages/ImoveisArrendados"));
const ImoveisVendidos = lazy(() => import("@/pages/ImoveisVendidos"));
const ImoveisIndisponiveis = lazy(() => import("@/pages/ImoveisIndisponiveis"));
const ExplorarMapa = lazy(() => import("@/pages/ExplorarMapa"));
const ContractSign = lazy(() => import("@/pages/ContractSign"));
const TourVirtualManager = lazy(() => import("@/pages/TourVirtualManager"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-page" />
    </div>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    startTransition(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <PageTransition>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/imoveis" component={Imoveis} />
            <Route path="/arrendar" component={Arrendar} />
            <Route path="/comprar" component={Comprar} />
            <Route path="/imoveis/:id" component={ImovelDetalhes} />
            <Route path="/imoveis/:propertyId/tour-virtual" component={TourVirtualManager} />
            <Route path="/explorar-mapa" component={ExplorarMapa} />
            <Route path="/servicos" component={Servicos} />
            <Route path="/sobre" component={Sobre} />
            <Route path="/contacto" component={Contacto} />
            <Route path="/login" component={Login} />
            <Route path="/cadastro" component={Cadastro} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/cadastrar-imovel" component={CadastrarImovel} />
            <Route path="/perfil" component={Profile} />
            <Route path="/contratos-ativos" component={ContratosAtivos} />
            <Route path="/contratos/:id/assinar" component={ContractSign} />
            <Route path="/visitas-agendadas" component={VisitasAgendadas} />
            <Route path="/meus-imoveis" component={MeusImoveis} />
            <Route path="/imoveis-pendentes" component={ImoveisPendentes} />
            <Route path="/editar-imovel/:id" component={EditarImovel} />
            <Route path="/imoveis-disponiveis" component={ImoveisDisponiveis} />
            <Route path="/imoveis-arrendados" component={ImoveisArrendados} />
            <Route path="/imoveis-vendidos" component={ImoveisVendidos} />
            <Route path="/imoveis-indisponiveis" component={ImoveisIndisponiveis} />
            <Route path="/admin/imoveis" component={AdminImoveis} />
            <Route path="/admin/aprovar-imoveis" component={AdminAprovarImoveis} />
            <Route path="/admin/usuarios" component={AdminUsuarios} />
            <Route path="/admin/anuncios" component={AdminAnuncios} />
            <Route component={NotFound} />
          </Switch>
        </PageTransition>
      </Suspense>
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

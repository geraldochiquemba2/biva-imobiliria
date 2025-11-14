import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, LogOut, LayoutDashboard, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePrefetch } from "@/hooks/use-prefetch";
import type { User as UserType } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImage from '@assets/BIVA LOG300.300_1761333109756.png';

export default function Header() {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { toast } = useToast();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { prefetchOnHover } = usePrefetch();

  const { data: currentUser } = useQuery<UserType | null>({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/logout', {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.removeQueries({ queryKey: ['/api/auth/me'] });
      queryClient.clear();
      toast({
        title: "Logout realizado com sucesso",
        description: "Até breve!",
      });
      navigate('/');
    },
    onError: () => {
      toast({
        title: "Erro ao fazer logout",
        variant: "destructive",
      });
    },
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { label: 'Início', path: '/', testId: 'inicio' },
    { label: 'Imóveis', path: '/imoveis', testId: 'imoveis' },
    { label: 'Alto Padrão', path: '/altos-padrao', testId: 'alto-padrao' },
    { label: 'Coworking', path: '/coworking', testId: 'coworking' },
    { label: 'Curta Duração', path: '/imoveis-curta-duracao', testId: 'curta-duracao' },
    { label: 'Explorar Mapa', path: '/explorar-mapa', testId: 'explorar-mapa' },
    { label: 'Serviços', path: '/servicos', testId: 'servicos' },
    { label: 'Sobre', path: '/sobre', testId: 'sobre' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-6" ref={mobileMenuRef}>
        <div className="flex items-center justify-between h-24">
          <Link href="/" data-testid="link-logo" className="flex-shrink-0">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <img 
                src={logoImage} 
                alt="BIVA Imobiliária" 
                className="h-14 sm:h-16 md:h-20 w-auto object-contain dark:brightness-0 dark:invert transition-all"
                style={{ aspectRatio: 'auto' }}
              />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                location === '/' ? 'text-primary' : 'text-muted-foreground'
              }`}
              data-testid="link-inicio"
              {...prefetchOnHover('/')}
            >
              Início
            </Link>
            
            <Link
              href="/arrendar"
              className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                location === '/arrendar' ? 'text-primary' : 'text-muted-foreground'
              }`}
              data-testid="link-arrendar"
              {...prefetchOnHover('/arrendar')}
            >
              Arrendar
            </Link>
            <Link
              href="/comprar"
              className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                location === '/comprar' ? 'text-primary' : 'text-muted-foreground'
              }`}
              data-testid="link-comprar"
              {...prefetchOnHover('/comprar')}
            >
              Comprar
            </Link>
            
            {navItems.slice(1).map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  location === item.path ? 'text-primary' : 'text-muted-foreground'
                }`}
                data-testid={`link-${item.testId}`}
                {...prefetchOnHover(item.path)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {currentUser ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="hidden md:flex"
                  data-testid="button-dashboard"
                >
                  <Link href="/dashboard" {...prefetchOnHover('/dashboard')}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="button-user-menu">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel data-testid="text-user-name">
                      {currentUser.fullName}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link href="/dashboard" data-testid="link-mobile-dashboard">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/perfil" data-testid="link-profile">
                        <User className="h-4 w-4 mr-2" />
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  data-testid="button-login"
                >
                  <Link href="/login" {...prefetchOnHover('/login')}>Entrar</Link>
                </Button>

                <Button
                  size="sm"
                  asChild
                  data-testid="button-register"
                >
                  <Link href="/cadastro" {...prefetchOnHover('/cadastro')}>Cadastro</Link>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              <Link 
                href="/"
                className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  location === '/' ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
                data-testid="link-mobile-inicio"
              >
                Início
              </Link>
              
              <Link
                href="/arrendar"
                className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  location === '/arrendar' ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
                data-testid="link-mobile-arrendar"
              >
                Arrendar
              </Link>
              <Link
                href="/comprar"
                className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  location === '/comprar' ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
                data-testid="link-mobile-comprar"
              >
                Comprar
              </Link>
              
              {navItems.slice(1).map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                    location === item.path ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-${item.testId}`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t">
                {currentUser ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                      data-testid="button-mobile-dashboard-nav"
                    >
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      data-testid="button-mobile-logout"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                      data-testid="button-mobile-login"
                    >
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        Entrar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      className="w-full"
                      asChild
                      data-testid="button-mobile-register"
                    >
                      <Link href="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                        Cadastro
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

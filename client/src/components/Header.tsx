import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X } from "lucide-react";
import logoImage from '@assets/BIVA LOG300.300_1761333109756.png';

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const navItems = [
    { label: 'Início', path: '/' },
    { label: 'Imóveis', path: '/imoveis' },
    { label: 'Serviços', path: '/servicos' },
    { label: 'Sobre', path: '/sobre' },
    { label: 'Contacto', path: '/contacto' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-24">
          <Link href="/" data-testid="link-logo">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <img 
                src={logoImage} 
                alt="BIVA Imobiliária" 
                className="h-20 w-auto dark:brightness-0 dark:invert transition-all"
              />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  location === item.path ? 'text-primary' : 'text-muted-foreground'
                }`}
                data-testid={`link-${item.label.toLowerCase()}`}
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

            <Button
              variant="outline"
              size="sm"
              data-testid="button-login"
            >
              Entrar
            </Button>

            <Button
              size="sm"
              data-testid="button-register"
            >
              Cadastro
            </Button>

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
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                    location === item.path ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

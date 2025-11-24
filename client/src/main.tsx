import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Safely mount the app
try {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error('Failed to mount app:', error);
  
  // Fallback UI if React fails to load
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; text-align: center; font-family: system-ui, -apple-system, sans-serif;">
        <div>
          <h1 style="font-size: 24px; margin-bottom: 16px; color: #dc2626;">Erro ao Carregar</h1>
          <p style="color: #666; margin-bottom: 20px;">
            Ocorreu um erro ao carregar a aplicação. Por favor, tente:
          </p>
          <ul style="text-align: left; color: #666; margin-bottom: 20px;">
            <li>Recarregar a página (Ctrl+F5 ou Cmd+Shift+R)</li>
            <li>Limpar o cache do navegador</li>
            <li>Tentar com outro navegador</li>
          </ul>
          <button 
            onclick="window.location.reload(true)" 
            style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    `;
  }
}

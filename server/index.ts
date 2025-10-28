import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";

const app = express();

// Enable gzip compression for all responses
app.use(compression());

// Keep-alive system for Render.com
let keepAliveInterval: NodeJS.Timeout | null = null;

function setupKeepAlive(port: number) {
  // Only enable in production
  if (process.env.NODE_ENV === 'production') {
    const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

    if (RENDER_EXTERNAL_URL) {
      log('Setting up keep-alive for Render...');

      // Ping every 14 minutes to prevent hibernation (Render sleeps after 15 minutes of inactivity)
      keepAliveInterval = setInterval(async () => {
        try {
          const response = await fetch(`${RENDER_EXTERNAL_URL}/api/health`);
          if (response.ok) {
            log('Keep-alive ping successful');
          }
        } catch (error) {
          log('Keep-alive ping failed:', (error as Error).message || 'Unknown error');
        }
      }, 14 * 60 * 1000); // 14 minutes
    }
  }
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
  limit: '50mb' // Aumentar limite para suportar imagens em base64 (50MB)
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await seedDatabase();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    setupKeepAlive(port);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('SIGTERM received, shutting down gracefully...');
    stopKeepAlive();
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });
})();
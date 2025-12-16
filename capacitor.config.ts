import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.biva.app',
  appName: 'BIVA Imobiliária',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // For development, you can enable this to load from your dev server:
    // url: 'https://your-replit-url.replit.dev',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: true,
      spinnerColor: '#f59e0b',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a2e',
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
  },
};

export default config;

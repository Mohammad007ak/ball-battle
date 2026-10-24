import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.chakachak.game',
  appName: 'چکاچک',
  webDir: 'dist',
  android: {
    // Gem packs are bought through the store app; no mixed content, no remote debugging in release.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#0c1d4f',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: { overlaysWebView: true, style: 'DARK' },
  },
};

export default config;

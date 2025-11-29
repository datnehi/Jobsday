import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { Buffer } from 'buffer';

(window as any).global = window;
(globalThis as any).Buffer = Buffer;
(globalThis as any).process = (globalThis as any).process || { env: { DEBUG: undefined }, version: '' };

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

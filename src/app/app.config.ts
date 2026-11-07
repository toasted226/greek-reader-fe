import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideDefaultClient } from '../api';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { CredentialsInterceptor } from './auth/credentials.interceptor';
import { CsrfInterceptor } from './auth/csrf.interceptor';

declare global {
  interface Window {
    __GREEK_READER_CONFIG__?: {
      apiBaseUrl?: string;
    };
  }
}

const apiBaseUrl =
  typeof window !== 'undefined'
    ? (window.__GREEK_READER_CONFIG__?.apiBaseUrl ?? 'http://localhost:3000')
    : 'http://localhost:3000';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideDefaultClient({ basePath: apiBaseUrl }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CredentialsInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CsrfInterceptor,
      multi: true,
    },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
  ],
};

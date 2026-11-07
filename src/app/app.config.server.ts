import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { BASE_PATH_DEFAULT } from '../api';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: BASE_PATH_DEFAULT,
      useValue: (process.env['API_BASE_URL'] ?? 'http://localhost:3000').replace(/\/+$/, ''),
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);

import { Routes } from '@angular/router';
import { authChildGuard, authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/verify',
    loadComponent: () =>
      import('./pages/auth/verify/verify.component').then((m) => m.VerifyComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    children: [
      {
        path: 'analyse',
        loadComponent: () =>
          import('./pages/analyse/analyse.component').then((m) => m.AnalyseComponent),
      },
      {
        path: 'file-analyser',
        loadComponent: () =>
          import('./pages/file-analyser/file-analyser.component').then(
            (m) => m.FileAnalyserComponent,
          ),
      },
      {
        path: 'files',
        redirectTo: 'file-analyser',
        pathMatch: 'full',
      },
      {
        path: 'lemmas',
        loadComponent: () =>
          import('./pages/saved-words/saved-words.component').then((m) => m.SavedWordsComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: '',
        redirectTo: 'analyse',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'analyse',
    redirectTo: 'dashboard/analyse',
    pathMatch: 'full',
  },
  {
    path: 'file-analyser',
    redirectTo: 'dashboard/file-analyser',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];

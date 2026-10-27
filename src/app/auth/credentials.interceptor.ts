import { isPlatformServer } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_PATH_DEFAULT } from '../../api';

@Injectable({ providedIn: 'root' })
export class CredentialsInterceptor implements HttpInterceptor {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly basePath = inject(BASE_PATH_DEFAULT);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const serverSide = isPlatformServer(this.platformId);
    let url = req.url;
    if (serverSide && !/^https?:\/\//i.test(url) && /^https?:\/\//i.test(this.basePath)) {
      url = `${this.basePath.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
    }

    const credReq = req.clone({ url, withCredentials: true });
    return next.handle(credReq);
  }
}

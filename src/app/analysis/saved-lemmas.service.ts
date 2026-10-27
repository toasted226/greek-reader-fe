import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, catchError, finalize } from 'rxjs';
import { CreateUserLemmaRequest, LemmaResponse, LexiconEndpointsService, UserLemmaResponse } from '../../api';

@Injectable({ providedIn: 'root' })
export class SavedLemmasService {
  private readonly endpoints = inject(LexiconEndpointsService);
  private readonly savedLemmasSignal = signal<UserLemmaResponse[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly loadErrorSignal = signal(false);
  readonly savedLemmas = this.savedLemmasSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly loadError = this.loadErrorSignal.asReadonly();

  constructor() {
    this.refresh();
  }

  isSaved(lemma: LemmaResponse): boolean {
    return this.savedLemmasSignal().some((saved) => String(saved.lemma.id) === String(lemma.id));
  }

  toggle(lemma: LemmaResponse, contextSentence: string): void {
    const savedLemma = this.savedLemmasSignal().find((saved) =>
      String(saved.lemma.id) === String(lemma.id),
    );
    if (savedLemma?.id != null) {
      this.endpoints.lemmasLemmaIdDelete(Number(savedLemma.lemma.id)).pipe(
        catchError(() => EMPTY),
      ).subscribe(() => {
        this.savedLemmasSignal.update((lemmas) => lemmas.filter((saved) => saved.id !== savedLemma.id));
      });
      return;
    }

    const request: CreateUserLemmaRequest = { lemmaId: lemma.id, contextSentence };
    this.endpoints.lemmasPost(request).pipe(
      catchError(() => EMPTY),
    ).subscribe((created) => {
      if (created?.id != null) {
        this.savedLemmasSignal.update((lemmas) => [...lemmas, created]);
      } else {
        this.refresh();
      }
    });
  }

  refresh(): void {
    this.loadingSignal.set(true);
    this.loadErrorSignal.set(false);
    this.endpoints.lemmasGet().pipe(
      catchError(() => {
        this.loadErrorSignal.set(true);
        return EMPTY;
      }),
      finalize(() => this.loadingSignal.set(false)),
    ).subscribe((lemmas) => this.savedLemmasSignal.set(lemmas));
  }
}

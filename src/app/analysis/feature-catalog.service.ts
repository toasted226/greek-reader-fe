import { inject, Injectable } from '@angular/core';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';
import { FeaturesResponse, LexiconEndpointsService } from '../../api';

/**
 * Canonical frontend cache for the morphological feature catalog served by
 * `GET /lexicon/features`.
 *
 * API contract:
 *   - Always responds with `{ features: string[] }`.
 *   - Omit `partOfSpeech` to get every distinct feature across all parts of speech.
 *   - An unrecognised `partOfSpeech` returns an empty list (not an error).
 *   - Feature strings are identical to the values `?featureList=` accepts.
 *
 * Caching strategy (see the class body for the full rationale):
 *   - Resolved responses are cached per part of speech, keyed by `pos ?? '*'`.
 *   - Concurrent callers for the same key share a single in-flight request.
 *   - Errors are never cached, so a later call retries.
 *   - `peek()` exposes the cache synchronously for callers that need to act
 *     before an async response lands (e.g. pruning stale selected features).
 */
@Injectable({ providedIn: 'root' })
export class FeatureCatalogService {
  private readonly endpoints = inject(LexiconEndpointsService);

  /** Resolved feature lists, keyed by `pos ?? '*'` (the "all features" bucket). */
  private readonly cache = new Map<string, readonly string[]>();

  /** Requests currently on the wire, keyed the same way as `cache`. */
  private readonly inFlight = new Map<string, Observable<readonly string[]>>();

  /**
   * Returns the distinct feature strings available for `pos`.
   *
   * Pass `null` for the full catalog (the API's "no `partOfSpeech`" behaviour).
   * The returned observable is cold on first call and shared afterwards: every
   * subscriber for the same key during that window receives one HTTP request,
   * and later calls resolve from the in-memory cache without touching the
   * network.
   *
   * Errors propagate to the caller and are deliberately not cached — the entry
   * is dropped from the in-flight map so the next call retries.
   */
  getFeatures(pos: string | null): Observable<readonly string[]> {
    const key = cacheKey(pos);

    const cached = this.cache.get(key);
    if (cached) {
      return of(cached);
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending;
    }

    const request$ = this.endpoints.lexiconFeaturesGet(pos ?? undefined).pipe(
      map((response: FeaturesResponse) => normalizeFeatures(response)),
      tap((features) => this.cache.set(key, features)),
      // Runs on completion *and* error, so a failed request never blocks a retry.
      finalize(() => this.inFlight.delete(key)),
      shareReplay(1),
    );

    this.inFlight.set(key, request$);
    return request$;
  }

  /**
   * Synchronous cache probe. Returns the resolved feature list if the endpoint
   * has already answered for `pos`, otherwise `undefined`.
   *
   * Useful when an action must happen immediately (before a request could
   * complete) — for example pruning selected features when the user changes
   * part of speech.
   */
  peek(pos: string | null): readonly string[] | undefined {
    return this.cache.get(cacheKey(pos));
  }

  /** Drops every cached list and in-flight request. Intended for tests. */
  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }
}

function cacheKey(pos: string | null): string {
  return pos ?? '*';
}

/**
 * Defensive normalisation of the API payload: drops empty/non-string entries
 * and de-duplicates while preserving the API's order.
 *
 * Duplicate feature strings would break `@for (... ; track feature.key)` in the
 * chip list, and blank entries would render as empty buttons.
 */
function normalizeFeatures(response: FeaturesResponse | null | undefined): readonly string[] {
  const raw = response?.features;
  if (!Array.isArray(raw)) {
    return [];
  }

  const seen = new Set<string>();
  const features: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string') {
      continue;
    }
    const value = entry.trim();
    if (value === '' || seen.has(value)) {
      continue;
    }
    seen.add(value);
    features.push(value);
  }

  return Object.freeze(features);
}

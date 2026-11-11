import { TestBed } from '@angular/core/testing';
import { Subject, firstValueFrom, of, throwError } from 'rxjs';
import { FeatureCatalogService } from './feature-catalog.service';
import { LexiconEndpointsService } from '../../api/services/lexiconEndpoints.service';
import { FeaturesResponse } from '../../api/models';

describe('FeatureCatalogService', () => {
  let service: FeatureCatalogService;
  let lexiconServiceMock: { lexiconFeaturesGet: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    lexiconServiceMock = {
      lexiconFeaturesGet: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        FeatureCatalogService,
        { provide: LexiconEndpointsService, useValue: lexiconServiceMock },
      ],
    });

    service = TestBed.inject(FeatureCatalogService);
  });

  const response = (...features: string[]): FeaturesResponse => ({ features });

  it('calls the endpoint without a partOfSpeech for the full catalog', async () => {
    lexiconServiceMock.lexiconFeaturesGet.mockReturnValue(of(response('masculine')));

    const features = await firstValueFrom(service.getFeatures(null));

    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledWith(undefined);
    expect(features).toEqual(['masculine']);
  });

  it('passes the part of speech through to the endpoint', async () => {
    lexiconServiceMock.lexiconFeaturesGet.mockReturnValue(of(response('present')));

    await firstValueFrom(service.getFeatures('verb'));

    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledWith('verb');
  });

  it('caches one response per part of speech', async () => {
    lexiconServiceMock.lexiconFeaturesGet.mockImplementation((pos?: string) =>
      of(response(pos === 'verb' ? 'present' : 'masculine')),
    );

    expect(await firstValueFrom(service.getFeatures('verb'))).toEqual(['present']);
    expect(await firstValueFrom(service.getFeatures('verb'))).toEqual(['present']);
    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledTimes(1);

    expect(await firstValueFrom(service.getFeatures('noun'))).toEqual(['masculine']);
    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledTimes(2);
  });

  it('treats the full catalog as a separate cache entry from any part of speech', async () => {
    lexiconServiceMock.lexiconFeaturesGet.mockReturnValue(of(response('masculine', 'present')));

    await firstValueFrom(service.getFeatures(null));
    await firstValueFrom(service.getFeatures('noun'));
    await firstValueFrom(service.getFeatures(null));

    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledTimes(2);
  });

  it('shares a single request between concurrent subscribers', () => {
    const pending = new Subject<FeaturesResponse>();
    lexiconServiceMock.lexiconFeaturesGet.mockReturnValue(pending.asObservable());

    const received: (readonly string[])[] = [];
    service.getFeatures('noun').subscribe((f) => received.push(f));
    service.getFeatures('noun').subscribe((f) => received.push(f));

    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledTimes(1);

    pending.next(response('masculine', 'feminine'));
    pending.complete();

    expect(received).toEqual([
      ['masculine', 'feminine'],
      ['masculine', 'feminine'],
    ]);
  });

  it('returns the same list to subscribers that join while the request is in flight', () => {
    const pending = new Subject<FeaturesResponse>();
    lexiconServiceMock.lexiconFeaturesGet.mockReturnValue(pending.asObservable());

    const first: (readonly string[])[] = [];
    service.getFeatures('verb').subscribe((f) => first.push(f));
    pending.next(response('present'));
    pending.complete();

    // Already resolved → served from cache without another request.
    let second: readonly string[] = [];
    service.getFeatures('verb').subscribe((f) => (second = f));

    expect(first).toEqual([['present']]);
    expect(second).toEqual(['present']);
    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledTimes(1);
  });

  it('normalises the payload: trims, drops blanks and de-duplicates', async () => {
    lexiconServiceMock.lexiconFeaturesGet.mockReturnValue(
      of(response(' masculine ', '', 'masculine', 'nominative')),
    );

    expect(await firstValueFrom(service.getFeatures(null))).toEqual(['masculine', 'nominative']);
  });

  it('tolerates a malformed payload', async () => {
    lexiconServiceMock.lexiconFeaturesGet.mockReturnValue(of({} as FeaturesResponse));

    expect(await firstValueFrom(service.getFeatures('noun'))).toEqual([]);
  });

  it('caches an empty list (unrecognised part of speech) without erroring', async () => {
    lexiconServiceMock.lexiconFeaturesGet.mockReturnValue(of(response()));

    expect(await firstValueFrom(service.getFeatures('not-a-pos'))).toEqual([]);
    expect(await firstValueFrom(service.getFeatures('not-a-pos'))).toEqual([]);
    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledTimes(1);
  });

  it('does not cache errors, so a later call retries', async () => {
    lexiconServiceMock.lexiconFeaturesGet
      .mockReturnValueOnce(throwError(() => new Error('network')))
      .mockReturnValueOnce(of(response('masculine')));

    await expect(firstValueFrom(service.getFeatures('noun'))).rejects.toThrow('network');

    expect(await firstValueFrom(service.getFeatures('noun'))).toEqual(['masculine']);
    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledTimes(2);
  });

  it('exposes cached lists synchronously through peek()', async () => {
    lexiconServiceMock.lexiconFeaturesGet.mockReturnValue(of(response('present')));

    expect(service.peek('verb')).toBeUndefined();

    await firstValueFrom(service.getFeatures('verb'));

    expect(service.peek('verb')).toEqual(['present']);
    expect(service.peek('noun')).toBeUndefined();
  });

  it('clear() drops cached lists', async () => {
    lexiconServiceMock.lexiconFeaturesGet.mockReturnValue(of(response('present')));

    await firstValueFrom(service.getFeatures('verb'));
    service.clear();

    expect(service.peek('verb')).toBeUndefined();

    await firstValueFrom(service.getFeatures('verb'));
    expect(lexiconServiceMock.lexiconFeaturesGet).toHaveBeenCalledTimes(2);
  });
});

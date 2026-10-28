import { Component, input } from '@angular/core';
import { LemmaResponse } from '../../../../api';
import { findForm } from '../../inflection-utils';

interface Feature {
  key: string;
  label: string;
}

const toFeatures = (...keys: string[]): Feature[] =>
  keys.map((key) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
  }));

@Component({
  selector: 'app-proper-noun',
  imports: [],
  templateUrl: './proper-noun.html',
  styleUrl: './proper-noun.css',
  host: {
    class: 'block',
  },
})
export class ProperNoun {
  readonly lemma = input.required<LemmaResponse>();

  protected readonly cases = toFeatures('nominative', 'accusative', 'genitive', 'vocative');

  getForm(features: string[]): string {
    return findForm(this.lemma().forms, features);
  }
}

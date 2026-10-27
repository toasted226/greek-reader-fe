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
  selector: 'app-adjective',
  imports: [],
  templateUrl: './adjective.html',
  styleUrl: './adjective.css',
  host: {
    class: 'block',
  },
})
export class Adjective {
  readonly lemma = input.required<LemmaResponse>();

  protected readonly degrees = toFeatures('positive', 'comparative', 'superlative');
  protected readonly genders = toFeatures('masculine', 'feminine', 'neuter');
  protected readonly cases = toFeatures('nominative', 'accusative', 'genitive', 'vocative');

  hasDegree(degree: string): boolean {
    return this.lemma().forms.some((form) => form.features.includes(degree));
  }

  getForm(features: string[]): string {
    return findForm(this.lemma().forms, features);
  }
}

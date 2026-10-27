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
  selector: 'app-article',
  imports: [],
  templateUrl: './article.html',
  styleUrl: './article.css',
  host: {
    class: 'block',
  },
})
export class Article {
  readonly lemma = input.required<LemmaResponse>();

  protected readonly genders = toFeatures('masculine', 'feminine', 'neuter');
  protected readonly cases = toFeatures('nominative', 'accusative', 'genitive');

  hasGender(gender: string): boolean {
    return this.lemma().forms.some((form) => form.features.includes(gender));
  }

  getForm(features: string[]): string {
    return findForm(this.lemma().forms, features);
  }
}

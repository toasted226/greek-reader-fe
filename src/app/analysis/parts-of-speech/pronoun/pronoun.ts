import { Component, input } from '@angular/core';
import { FormResponse, LemmaResponse } from '../../../../api';
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

const genderKeys = new Set(['masculine', 'feminine', 'neuter']);
const personKeys = new Set(['first-person', 'second-person', 'third-person']);

@Component({
  selector: 'app-pronoun',
  imports: [],
  templateUrl: './pronoun.html',
  styleUrl: './pronoun.css',
  host: {
    class: 'block',
  },
})
export class Pronoun {
  readonly lemma = input.required<LemmaResponse>();

  protected readonly genders = toFeatures('masculine', 'feminine', 'neuter');
  protected readonly persons: Feature[] = [
    { key: 'first-person', label: 'First person' },
    { key: 'second-person', label: 'Second person' },
    { key: 'third-person', label: 'Third person' },
  ];
  protected readonly cases = toFeatures('nominative', 'accusative', 'genitive', 'vocative');

  hasGender(gender: string): boolean {
    return this.lemma().forms.some((form) => form.features.includes(gender));
  }

  hasPerson(person: string): boolean {
    return this.lemma().forms.some((form) =>
      form.features.includes(person) && !form.features.some((feature) => genderKeys.has(feature)),
    );
  }

  get otherForms(): FormResponse[] {
    return this.lemma().forms.filter((form) =>
      !form.features.some((feature) => genderKeys.has(feature) || personKeys.has(feature)),
    );
  }

  getForm(features: string[]): string {
    return findForm(this.lemma().forms, features);
  }

  getPersonForm(features: string[]): string {
    const genderlessForms = this.lemma().forms.filter((form) =>
      !form.features.some((feature) => genderKeys.has(feature)),
    );
    return findForm(genderlessForms, features);
  }
}

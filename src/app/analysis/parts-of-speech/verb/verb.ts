import { Component, input } from '@angular/core';
import { LemmaResponse } from '../../../../api';
import { findForm } from '../../inflection-utils';

interface VerbGroup {
  key: string;
  label: string;
  features: string[];
}

interface OtherForm {
  form: string;
  features: string;
}

interface ParticipleForm {
  tense: string;
  voice: string;
  form: string;
}

interface InfinitiveForm {
  voice: string;
  form: string;
}

const persons = [
  { key: 'first-person', label: 'First person' },
  { key: 'second-person', label: 'Second person' },
  { key: 'third-person', label: 'Third person' },
];
const numbers = ['singular', 'plural'];
const personFeatures = new Set(persons.map((person) => person.key));
const numberFeatures = new Set(numbers);

@Component({
  selector: 'app-verb',
  templateUrl: './verb.html',
  styleUrl: './verb.css',
  host: { class: 'block' },
})
export class Verb {
  readonly lemma = input.required<LemmaResponse>();

  get groups(): VerbGroup[] {
    const groups = new Map<string, VerbGroup>();
    for (const form of this.lemma().forms) {
      const features = form.features.filter((feature) =>
        !personFeatures.has(feature) && !numberFeatures.has(feature),
      );
      if (!form.features.some((feature) => personFeatures.has(feature))) continue;
      const key = features.join('|');
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          features,
          label: features.map((feature) => this.featureLabel(feature)).join(' · ') || 'Forms',
        });
      }
    }
    return [...groups.values()];
  }

  get otherForms(): OtherForm[] {
    return this.lemma().forms
      .filter((form) => !form.features.some((feature) => personFeatures.has(feature)
        || feature === 'participle' || feature === 'infinitive-aorist'))
      .map((form) => ({ form: form.form, features: form.features.map((feature) => this.featureLabel(feature)).join(', ') }));
  }

  get participleForms(): ParticipleForm[] {
    const grouped = new Map<string, ParticipleForm>();
    for (const form of this.lemma().forms.filter((entry) => entry.features.includes('participle'))) {
      const tense = this.titleCase(form.features.find((feature) => ['present', 'past', 'perfect'].includes(feature)) ?? '—');
      const voice = this.titleCase(form.features.find((feature) => ['active', 'passive'].includes(feature)) ?? '—');
      const key = `${tense}|${voice}`;
      const existing = grouped.get(key);
      if (existing) {
        const forms = existing.form.split(', ');
        if (!forms.includes(form.form)) existing.form = `${existing.form}, ${form.form}`;
      } else {
        grouped.set(key, { tense, voice, form: form.form });
      }
    }
    return [...grouped.values()];
  }

  get infinitiveForms(): InfinitiveForm[] {
    return this.lemma().forms
      .filter((form) => form.features.includes('infinitive-aorist'))
      .map((form) => ({
        voice: this.titleCase(form.features.find((feature) => ['active', 'passive'].includes(feature)) ?? '—'),
        form: form.form,
      }));
  }

  readonly persons = persons;
  readonly numbers = numbers;

  getForm(group: VerbGroup, person: string, number: string): string {
    return findForm(this.lemma().forms, [...group.features, person, number]);
  }

  private featureLabel(value: string): string {
    if (value === 'infinitive-aorist') return 'Aorist infinitive';
    return this.titleCase(value);
  }

  private titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

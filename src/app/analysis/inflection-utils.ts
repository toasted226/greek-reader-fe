import { FormResponse } from '../../api';

const normalizeForm = (form: string): string => form.normalize('NFC').toLocaleLowerCase('el');

export const findMatchingForms = (forms: FormResponse[], word: string): FormResponse[] => {
  if (!word) return [];

  const normalizedWord = normalizeForm(word);
  return forms.filter((form) => normalizeForm(form.form) === normalizedWord);
};

const isSubset = <T>(subset: T[], superset: T[]): boolean => {
  const superSetContainer = new Set(superset);
  return subset.every((item) => superSetContainer.has(item));
};

export const findForm = (forms: FormResponse[], features: string[]): string => {
  const form = forms
    .filter((f) => isSubset(features, f.features))
    .map((f) => f.form)
    .join(', ');
  return form === '' ? '-' : form;
};

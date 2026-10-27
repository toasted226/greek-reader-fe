import { Component, input } from '@angular/core';
import { LemmaResponse } from '../../../api';
import { findForm } from '../inflection-utils';
import { Adjective } from '../parts-of-speech/adjective/adjective';
import { Noun } from '../parts-of-speech/noun/noun';
import { Pronoun } from '../parts-of-speech/pronoun/pronoun';
import { Article } from '../parts-of-speech/article/article';
import { Numeral } from '../parts-of-speech/numeral/numeral';
import { Verb } from '../parts-of-speech/verb/verb';

@Component({
  selector: 'app-inflection-table',
  imports: [Adjective, Noun, Pronoun, Article, Numeral, Verb],
  templateUrl: './inflection-table.html',
  styleUrl: './inflection-table.css',
  host: {
    class: 'block',
  },
})
export class InflectionTable {
  readonly lemma = input.required<LemmaResponse>();

  getForm(features: string[]): string {
    return findForm(this.lemma().forms, features);
  }
}

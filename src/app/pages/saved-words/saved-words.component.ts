import { Component, inject } from '@angular/core';
import { LemmaItem } from '../../analysis/lemma-item/lemma-item';
import { SavedLemmasService } from '../../analysis/saved-lemmas.service';

@Component({
  selector: 'app-saved-words',
  imports: [LemmaItem],
  templateUrl: './saved-words.component.html',
  host: {
    class: 'block w-full',
  },
})
export class SavedWordsComponent {
  readonly savedLemmasService = inject(SavedLemmasService);
}

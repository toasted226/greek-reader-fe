import { Component, computed, input, output } from '@angular/core';
import { AnalyseResponse } from '../../../api';

@Component({
  selector: 'app-token',
  imports: [],
  templateUrl: './token.html',
  host: {
    class: 'inline',
  },
})
export class Token {
  readonly token = input.required<AnalyseResponse>();
  readonly isSelected = input<boolean>(false);
  readonly selected = output<AnalyseResponse>();
  readonly isUnmatched = computed(
    () => this.token().lemmas.length == 0
  );

  selectToken(): void {
    if (this.token().token.isWord) {
      this.selected.emit(this.token());
    }
  }

  onSpaceKey(event: Event): void {
    event.preventDefault();
    this.selectToken();
  }
}

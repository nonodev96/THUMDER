import { Directive, Input, OnChanges, OnDestroy, } from '@angular/core';


@Directive({
  selector: '[asyncClick][awaitClick]'
})
export class AwaitClickDirective implements OnChanges, OnDestroy {

  @Input('awaitClick') set awaitClick(option) {
    if (typeof option === 'string') {
      // toggle class when success
    } else if (typeof option === 'function') {
      // call function when success
    } else if (Array.isArray(option)) {
      // toggle class list
    }
  }

  ngOnChanges() {
  }

  ngOnDestroy() {
  }
}

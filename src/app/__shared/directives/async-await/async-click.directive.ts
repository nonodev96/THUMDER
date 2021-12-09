import {
  Directive,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Renderer2,
  ElementRef
} from '@angular/core';

import { Subscription, Observable } from 'rxjs';

const noop = () => {
};

@Directive({
  selector: '[asyncClick]'
})
export class AsyncClickDirective implements OnChanges, OnDestroy {
  private pending = true;
  private disabled = false;
  private subscription: Subscription;

  @Input('asyncClick') clickFunc;

  constructor(
    private _renderer: Renderer2,
    private _elementRef: ElementRef
  ) {
    this.pending = true;
    this.disabled = false;
    console.log(this._elementRef);
  }

  @HostListener('click')
  onClick() {
    console.log('click');
    if (typeof this.clickFunc === 'function') {
      this.subscribe(this.clickFunc());
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.pending) {
      this.enable();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  disable() {
    this._renderer.setAttribute(
      this._elementRef.nativeElement,
      'disabled',
      'true'
    );
    this._renderer.addClass(
      this._elementRef.nativeElement,
      'disabled',
    );
  }

  enable() {
    this._renderer.removeAttribute(
      this._elementRef.nativeElement,
      'disabled'
    );
    this._renderer.removeClass(
      this._elementRef.nativeElement,
      'disabled'
    );
  }

  subscribe(r) {
    this.pending = true;
    this.disable();
    const enable = () => this.enable();
    if (typeof r.subscribe === 'function') {
      this.subscription = (<Observable<any>>r).subscribe({
        next: noop,
        complete: enable,
        error: enable
      });
    } else if (typeof r.then === 'function') {
      (<Promise<any>>r).then(enable).catch(enable);
      this.subscription = null;
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

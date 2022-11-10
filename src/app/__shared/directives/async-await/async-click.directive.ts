import {
  Directive,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Renderer2,
  ElementRef,
} from "@angular/core";

import { Subscription, Observable } from "rxjs";


@Directive({
  selector: "[asyncClick]",
})
export class AsyncClickDirective implements OnChanges, OnDestroy {
  private pending = true;
  private subscription: Subscription;

  @Input("asyncClick") clickFunc;

  @Input() defaultButtonClass = '';
  @Input() successButtonClass = '';
  @Input() warningButtonClass = '';

  constructor(private _renderer: Renderer2,
              private _elementRef: ElementRef) {
    this._renderer.setAttribute(
      this._elementRef.nativeElement,
      "class",
      ""
    );
  }

  @HostListener("click")
  onClick() {
    if (typeof this.clickFunc === "function") {
      this.subscribe(this.clickFunc());
    }
  }

  ngOnChanges(/*changes: SimpleChanges*/) {
    const vector = this.defaultButtonClass.split(" ")
    this._elementRef.nativeElement.classList.add(
      ...vector
    );
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
      "disabled",
      "true"
    );
  }

  enable() {
    this._renderer.removeAttribute(
      this._elementRef.nativeElement,
      "disabled",
    );
  }

  next(data: any) {
    console.log(data)
  }

  complete() {
    this._renderer.removeAttribute(
      this._elementRef.nativeElement,
      "disabled"
    );

    const vector_successButtonClass = this.successButtonClass.split(" ")
    const vector_warningButtonClass = this.warningButtonClass.split(" ")
    this._elementRef.nativeElement.classList.add(
      ...vector_successButtonClass
    );
    this._elementRef.nativeElement.classList.remove(
      ...vector_warningButtonClass
    );
  }

  error() {
    this._renderer.removeAttribute(
      this._elementRef.nativeElement,
      "disabled"
    );

    const vector_successButtonClass = this.successButtonClass.split(" ")
    const vector_warningButtonClass = this.warningButtonClass.split(" ")
    this._elementRef.nativeElement.classList.remove(
      ...vector_successButtonClass
    );
    this._elementRef.nativeElement.classList.add(
      ...vector_warningButtonClass
    );
  }

  subscribe(r) {
    this.pending = true;
    this.disable();
    const next = (data) => this.next(data);
    const complete = () => this.complete();
    const error = () => this.error();
    if (typeof r.subscribe === "function") {
      this.subscription = (r as Observable<any>).subscribe({
        next:     next,
        complete: complete,
        error:    error,
      });
    } else if (typeof r.then === "function") {
      (r as Promise<any>).then(complete).catch(error);
      this.subscription = null;
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

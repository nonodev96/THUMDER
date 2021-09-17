import { Directive, HostBinding, HostListener, Input } from '@angular/core';
import { from, Observable } from "rxjs";
import { take } from "rxjs/operators";

@Directive({
  selector: 'a[appAsyncAwait]'
})
export class AsyncAwaitDirective {

  @HostBinding('disabled')
  public waiting = false;

  @Input()
  appClickWait: () => Observable<any> | Promise<any> = async() => void 0;

  @HostListener('click')
  clickEvent() {
    this.waiting = true;

    from(this.appClickWait()).pipe(take(1)).subscribe({
      // subscribe: () => this.waiting = false,
      complete: () => this.waiting = false,
      error: (e) => {
        console.error(e);
        this.waiting = false;
      }
    })
  }
}

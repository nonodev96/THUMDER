import { Directive, Input, OnChanges, OnDestroy, } from "@angular/core";


@Directive({
  selector: "[asyncClick][awaitClick]"
})
export class AwaitClickDirective implements OnChanges, OnDestroy {

  @Input("awaitClick") set awaitClick(option) {
    if (typeof option === "string") {
    } else if (typeof option === "function") {
    } else if (Array.isArray(option)) {
    }
  }

  ngOnChanges() {
  }

  ngOnDestroy() {
  }
}

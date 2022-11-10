import { Directive, Input } from "@angular/core";

@Directive({
  selector: "[asyncClick][awaitClick]"
})
export class AwaitClickDirective {

  @Input("awaitClick")
  set awaitClick(option) {
    if (typeof option === "string") {
      console.log("string")
    } else if (typeof option === "function") {
      console.log("Function")
    } else if (Array.isArray(option)) {
      console.log("Array.isArray(option)")
    }
  }
}

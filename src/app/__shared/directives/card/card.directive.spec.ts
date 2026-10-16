import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { CardDirective, CardRegistry, CardWidgetDirective } from "@shared/directives/card/card.directive";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

@Component({
  standalone: true,
  imports: [CardDirective, CardWidgetDirective],
  template: `
    <div thumderCard class="card" id="first" (collapsed)="log.push('collapsed')" (expanded)="log.push('expanded')"
         (maximized)="log.push('maximized')" (minimized)="log.push('minimized')">
      <div class="card-header">
        <span class="title" thumderCardWidget="collapse">Title</span>
        <div class="card-tools">
          <button type="button" class="fold" thumderCardWidget="collapse"><i class="fas fa-minus"></i></button>
          <button type="button" class="max" thumderCardWidget="maximize"><i class="fas fa-expand"></i></button>
        </div>
      </div>
      <div class="card-body">Body</div>
    </div>
    @if (second) {
      <div thumderCard class="card collapsed-card" id="second">
        <button type="button" class="fold" thumderCardWidget="collapse"><i class="fas fa-minus"></i></button>
        <button type="button" class="max" thumderCardWidget="maximize"><i class="fas fa-expand"></i></button>
      </div>
    }
  `,
})
class HostComponent {
  public log: string[] = [];
  public second = true;
}

describe("CardDirective", () => {
  let fixture: ComponentFixture<HostComponent>;
  const card = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  const click = (id: string, selector: string) => (card(id).querySelector(selector) as HTMLElement).click();
  const icon = (id: string, selector: string) => [...(card(id).querySelector(`${selector} i`) as HTMLElement).classList].filter((name) => name !== "fas");

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    document.documentElement.classList.remove("maximized-card");
  });

  it("folds and unfolds the card, with the icon, the state for screen readers and the outputs", () => {
    click("first", ".fold");
    expect(card("first").classList).toContain("collapsed-card");
    expect(icon("first", ".fold")).toEqual(["fa-plus"]);
    expect(card("first").querySelector(".fold")?.getAttribute("aria-expanded")).toBe("false");
    click("first", ".title");
    expect(card("first").classList).not.toContain("collapsed-card");
    expect(icon("first", ".fold")).toEqual(["fa-minus"]);
    expect(fixture.componentInstance.log).toEqual(["collapsed", "expanded"]);
  });

  it("starts folded with the class of the template", () => {
    expect(icon("second", ".fold")).toEqual(["fa-plus"]);
    expect(card("second").querySelector(".fold")?.getAttribute("aria-expanded")).toBe("false");
  });

  it("fills the screen and stops the page from scrolling until the last maximized card is restored", () => {
    click("first", ".max");
    expect(card("first").classList).toContain("maximized-card");
    expect(document.documentElement.classList).toContain("maximized-card");
    expect(icon("first", ".max")).toEqual(["fa-compress"]);
    click("second", ".max");
    expect(card("second").classList).toContain("was-collapsed");
    click("first", ".max");
    expect(document.documentElement.classList).toContain("maximized-card");
    click("second", ".max");
    expect(card("second").classList).not.toContain("was-collapsed");
    expect(document.documentElement.classList).not.toContain("maximized-card");
    expect(fixture.componentInstance.log).toEqual(["maximized", "minimized"]);
  });

  it("a maximized card that disappears gives the scroll back to the page", () => {
    click("second", ".max");
    fixture.componentInstance.second = false;
    fixture.detectChanges();
    expect(document.documentElement.classList).not.toContain("maximized-card");
  });

  it("the registry folds all the cards but the ones it is told, and tells every change", () => {
    const registry = TestBed.inject(CardRegistry);
    const changes: string[] = [];
    const subscription = registry.changes$.subscribe(({ card, change }) => changes.push(`${card.id} ${change}`));
    click("second", ".fold");
    registry.collapseAll((card) => card.id === "second");
    expect(card("first").classList).toContain("collapsed-card");
    expect(card("second").classList).not.toContain("collapsed-card");
    expect(changes).toEqual(["second expanded", "first collapsed"]);
    subscription.unsubscribe();
  });
});

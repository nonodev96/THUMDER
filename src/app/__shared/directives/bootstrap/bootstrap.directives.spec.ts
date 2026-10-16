import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { CollapseDirective, CollapseToggleDirective } from "@shared/directives/bootstrap/collapse.directive";
import { DropdownDirective } from "@shared/directives/bootstrap/dropdown.directive";
import { ModalDismissDirective, ModalOpenDirective, ModalService } from "@shared/directives/bootstrap/modal.directive";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

@Component({
  standalone: true,
  imports: [DropdownDirective, CollapseDirective, CollapseToggleDirective, ModalOpenDirective, ModalDismissDirective],
  template: `
    <div class="dropdown" thumderDropdown>
      <button type="button" class="dropdown-toggle" id="toggle" aria-expanded="false">Language</button>
      <div class="dropdown-menu">
        <button type="button" class="dropdown-item" id="es">Español</button>
        <button type="button" class="dropdown-item" id="en">English</button>
      </div>
    </div>
    <button type="button" id="outside">Outside</button>

    <a href="#one" id="toggle-one" [thumderCollapseToggle]="one">One</a>
    <div id="one" class="collapse" thumderCollapse #one="thumderCollapse" thumderCollapseGroup="g" [thumderCollapseOpen]="true">1</div>
    <a href="#two" id="toggle-two" [thumderCollapseToggle]="two">Two</a>
    <div id="two" class="collapse" thumderCollapse #two="thumderCollapse" thumderCollapseGroup="g">2</div>

    <button type="button" id="opener" thumderModalOpen="dialog">Edit</button>
    <div class="modal fade" id="dialog" tabindex="-1" aria-hidden="true" style="display: none">
      <div class="modal-dialog">
        <div class="modal-content">
          <button type="button" class="close" id="dismiss" thumderModalDismiss>×</button>
          <input id="field" />
        </div>
      </div>
    </div>
  `,
})
class HostComponent {}

describe("Bootstrap directives without jQuery", () => {
  let fixture: ComponentFixture<HostComponent>;
  const el = (id: string) => document.getElementById(id) as HTMLElement;
  const key = (target: HTMLElement, name: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    fixture.nativeElement.remove();
    for (const backdrop of document.querySelectorAll(".modal-backdrop")) backdrop.remove();
    document.body.classList.remove("modal-open");
  });

  describe("DropdownDirective", () => {
    const menu = () => fixture.nativeElement.querySelector(".dropdown-menu") as HTMLElement;

    it("opens and closes with its button, and closes when an option is chosen", () => {
      el("toggle").click();
      expect(menu().classList).toContain("show");
      expect(el("toggle").getAttribute("aria-expanded")).toBe("true");
      el("en").click();
      expect(menu().classList).not.toContain("show");
      expect(el("toggle").getAttribute("aria-expanded")).toBe("false");
    });

    it("closes with a click outside", () => {
      el("toggle").click();
      el("outside").click();
      expect(menu().classList).not.toContain("show");
    });

    it("the arrows open it and move between the options; Escape closes it and focuses the button", () => {
      el("toggle").focus();
      key(el("toggle"), "ArrowDown");
      expect(menu().classList).toContain("show");
      expect(document.activeElement?.id).toBe("es");
      key(el("es"), "ArrowDown");
      expect(document.activeElement?.id).toBe("en");
      key(el("en"), "ArrowDown");
      expect(document.activeElement?.id).toBe("en");
      key(el("en"), "ArrowUp");
      expect(document.activeElement?.id).toBe("es");
      key(el("es"), "Escape");
      expect(menu().classList).not.toContain("show");
      expect(document.activeElement?.id).toBe("toggle");
    });
  });

  describe("CollapseDirective", () => {
    it("opening a panel of an accordion closes the others, and the links say which one is open", () => {
      expect(el("one").classList).toContain("show");
      expect(el("toggle-one").getAttribute("aria-expanded")).toBe("true");
      expect(el("toggle-one").getAttribute("aria-controls")).toBe("one");
      el("toggle-two").click();
      fixture.detectChanges();
      expect(el("one").classList).not.toContain("show");
      expect(el("two").classList).toContain("show");
      expect(el("toggle-one").getAttribute("aria-expanded")).toBe("false");
      el("toggle-two").click();
      fixture.detectChanges();
      expect(el("two").classList).not.toContain("show");
    });
  });

  describe("ModalService", () => {
    it("shows the modal with its backdrop, and closes it with its button giving the focus back", () => {
      vi.useFakeTimers();
      el("opener").focus();
      el("opener").click();
      expect(el("dialog").style.display).toBe("block");
      expect(el("dialog").classList).toContain("show");
      expect(el("dialog").getAttribute("aria-modal")).toBe("true");
      expect(el("dialog").hasAttribute("aria-hidden")).toBe(false);
      expect(document.body.classList).toContain("modal-open");
      expect(document.querySelectorAll(".modal-backdrop.show")).toHaveLength(1);
      expect(TestBed.inject(ModalService).isOpen("dialog")).toBe(true);
      el("dismiss").click();
      expect(el("dialog").classList).not.toContain("show");
      expect(document.body.classList).not.toContain("modal-open");
      expect(document.activeElement?.id).toBe("opener");
      vi.advanceTimersByTime(300);
      expect(el("dialog").style.display).toBe("none");
      expect(el("dialog").getAttribute("aria-hidden")).toBe("true");
      expect(document.querySelectorAll(".modal-backdrop")).toHaveLength(0);
      vi.useRealTimers();
    });

    it("closes with Escape and with a click outside its dialog, but not with a click inside", () => {
      const modals = TestBed.inject(ModalService);
      modals.open("dialog");
      key(el("field"), "Escape");
      expect(modals.isOpen("dialog")).toBe(false);
      modals.open("dialog");
      el("field").click();
      expect(modals.isOpen("dialog")).toBe(true);
      el("dialog").click();
      expect(modals.isOpen("dialog")).toBe(false);
    });
  });
});

import { CONSENT_KEY, CONSENT_VERSION, readConsent } from "@core/services/consent/consent.service";
import { beforeEach, describe, expect, it } from "vitest";

describe("the consent kept in the browser", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "cookieconsent_status=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it("is null until the user answers", () => {
    expect(readConsent()).toBeNull();
  });

  it("reads the choice of this version of the policy, and asks again with another one", () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true, errors: false, version: CONSENT_VERSION, date: "2026-01-01" }));
    expect(readConsent()).toMatchObject({ analytics: true, errors: false });
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true, errors: false, version: CONSENT_VERSION - 1, date: "2025-01-01" }));
    expect(readConsent()).toBeNull();
    localStorage.setItem(CONSENT_KEY, "not json");
    expect(readConsent()).toBeNull();
  });

  it("takes the answer of the old banner (cookieconsent) and removes it", () => {
    localStorage.setItem("cookieconsent", "allow");
    expect(readConsent()).toMatchObject({ analytics: true, errors: true, version: CONSENT_VERSION });
    expect(localStorage.getItem("cookieconsent")).toBeNull();
    expect(JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "{}")).toMatchObject({ analytics: true });

    localStorage.clear();
    document.cookie = "cookieconsent_status=deny; path=/";
    expect(readConsent()).toMatchObject({ analytics: false });
    expect(document.cookie).not.toContain("cookieconsent_status");
  });
});

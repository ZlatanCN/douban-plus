/* ── Interest State Extractor — Unit Tests ──────────────────────── */
/* Tests the Subject interest module's read and proxy interfaces. */

import { describe, expect, it, vi } from "vitest";

import { extractInterestState, proxyInterestAction } from "@/extract/interest";

import { buildDoc, mockCookie } from "../helpers/doc";

describe(extractInterestState, () => {
  it("returns logged-out state when no ck cookie", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="interest_sectl">
  <a href="/do?action=wish">想看</a>
</div>
</body></html>`);
    const result = extractInterestState(doc);
    expect(result.loggedIn).toBeFalsy();
    expect(result.status).toBe("none");
    expect(result.marked).toBeFalsy();
  });

  it("detects S3 collect state with cookie set", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="interest_sect_level">
  <span class="j a_stars">
    <span>已看过</span>
  </span>
  <input type="hidden" id="n_rating" value="4" />
</div>
</body></html>`);
    const restore = mockCookie(doc, "ck=test123;");
    const result = extractInterestState(doc);
    expect(result.loggedIn).toBeTruthy();
    expect(result.status).toBe("collect");
    expect(result.marked).toBeTruthy();
    expect(result.rating).toBe(4);
    restore();
  });

  it("detects S3 wish state", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="interest_sect_level">
  <span class="j a_stars">
    <span>已想看</span>
  </span>
</div>
</body></html>`);
    const restore = mockCookie(doc, "ck=test456;");
    const result = extractInterestState(doc);
    expect(result.loggedIn).toBeTruthy();
    expect(result.status).toBe("wish");
    expect(result.marked).toBeTruthy();
    restore();
  });

  it("detects S3 do (watching) state", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="interest_sect_level">
  <span class="j a_stars">
    <span>已在看</span>
  </span>
</div>
</body></html>`);
    const restore = mockCookie(doc, "ck=test789;");
    const result = extractInterestState(doc);
    expect(result.loggedIn).toBeTruthy();
    expect(result.status).toBe("do");
    restore();
  });

  it("detects S2 collect state via anchor text + active class", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="interest_sectl">
  <a href="/do?action=collect" class="done">看过</a>
</div>
</body></html>`);
    const restore = mockCookie(doc, "ck=test;");
    const result = extractInterestState(doc);
    expect(result.loggedIn).toBeTruthy();
    expect(result.status).toBe("collect");
    // S2 does not set marked
    expect(result.marked).toBeFalsy();
    restore();
  });

  it("returns none state for logged-in user with no interest", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="interest_sectl">
  <a href="/do?action=wish">想看</a>
  <a href="/do?action=collect">看过</a>
</div>
</body></html>`);
    const restore = mockCookie(doc, "ck=test;");
    const result = extractInterestState(doc);
    expect(result.loggedIn).toBeTruthy();
    expect(result.status).toBe("none");
    restore();
  });
});

describe(proxyInterestAction, () => {
  it("proxy-clicks the requested original control", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="interest_sect_level">
  <a href="/do?action=wish">想看</a>
  <a href="/do?action=do">在看</a>
  <a href="/do?action=collect">看过</a>
</div>
</body></html>`);
    const clicked: string[] = [];
    for (const anchor of doc.querySelectorAll("a")) {
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        clicked.push(anchor.textContent?.trim() ?? "");
      });
    }

    proxyInterestAction(doc, "wish");
    proxyInterestAction(doc, "do");
    proxyInterestAction(doc, "collect");

    expect(clicked).toStrictEqual(["想看", "在看", "看过"]);
  });

  it("silently ignores an unavailable control", () => {
    const doc = buildDoc("<html><body><p>No interest</p></body></html>");
    expect(() => proxyInterestAction(doc, "wish")).not.toThrow();
  });

  it("resolves the original control for every action", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="interest_sect_level"></div>
</body></html>`);
    proxyInterestAction(doc, "wish");
    const root = doc.querySelector("#interest_sect_level");
    const anchor = doc.createElement("a");
    anchor.textContent = "想看";
    const clicked = vi.fn<() => void>();
    anchor.addEventListener("click", clicked);
    root?.append(anchor);

    proxyInterestAction(doc, "wish");

    expect(clicked).toHaveBeenCalledOnce();
  });
});

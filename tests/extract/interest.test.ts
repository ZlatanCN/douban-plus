/* ── Interest State Extractor — Unit Tests ──────────────────────── */
/* Tests extractInterestState, findInterestButtons, isInterestActive. */

import { describe, it, expect } from "vitest";

import {
  extractInterestState,
  findInterestButtons,
  isInterestActive,
} from "../../src/extract";
import { buildDoc, mockCookie } from "../helpers";

describe("extractInterestState", () => {
  it("returns logged-out state when no ck cookie", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="interest_sectl">
  <a href="/do?action=wish">想看</a>
</div>
</body></html>`);
    const result = extractInterestState(doc);
    expect(result.loggedIn).toBe(false);
    expect(result.status).toBe("none");
    expect(result.marked).toBe(false);
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
    expect(result.loggedIn).toBe(true);
    expect(result.status).toBe("collect");
    expect(result.marked).toBe(true);
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
    expect(result.loggedIn).toBe(true);
    expect(result.status).toBe("wish");
    expect(result.marked).toBe(true);
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
    expect(result.loggedIn).toBe(true);
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
    expect(result.loggedIn).toBe(true);
    expect(result.status).toBe("collect");
    // S2 does not set marked
    expect(result.marked).toBe(false);
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
    expect(result.loggedIn).toBe(true);
    expect(result.status).toBe("none");
    restore();
  });
});

describe("findInterestButtons", () => {
  it("finds wish/collect/do buttons from #interest_sect_level", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="interest_sect_level">
  <a href="/do?action=wish">想看</a>
  <a href="/do?action=do">在看</a>
  <a href="/do?action=collect">看过</a>
</div>
</body></html>`);
    const result = findInterestButtons(doc);
    expect(result.wish).not.toBeNull();
    expect(result.do).not.toBeNull();
    expect(result.collect).not.toBeNull();
  });

  it("returns null buttons when no interest section", () => {
    const doc = buildDoc("<html><body><p>No interest</p></body></html>");
    const result = findInterestButtons(doc);
    expect(result.wish).toBeNull();
    expect(result.collect).toBeNull();
  });
});

describe("isInterestActive", () => {
  it("returns true when element or parent has active class", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<a class="done" href="/do?action=collect">看过</a>
</body></html>`);
    const el = doc.querySelector("a");
    expect(isInterestActive(el)).toBe(true);
  });

  it("returns false when no active class", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<a href="/do?action=wish">想看</a>
</body></html>`);
    const el = doc.querySelector("a");
    expect(isInterestActive(el)).toBe(false);
  });

  it("returns false for null element", () => {
    expect(isInterestActive(null)).toBe(false);
  });
});

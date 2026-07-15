import { render } from "preact";
import { describe, expect, it } from "vitest";

import { HtmlContent, sanitizeHtml } from "@/components/common/html-content";

const renderHtml = (html: string): HTMLElement => {
  const root = document.createElement("div");
  render(<HtmlContent html={html} />, root);
  return root;
};

describe(sanitizeHtml, () => {
  it("drops script tags and their content", () => {
    const out = sanitizeHtml("<p>正文</p><script>alert(1)</script>");
    expect(out).toContain("<p>正文</p>");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
  });

  it("strips style attributes", () => {
    const out = sanitizeHtml('<p style="color:red">文字</p>');
    expect(out).toContain("文字");
    expect(out).not.toContain("style=");
  });

  it("neutralizes javascript: navigation on anchors", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    const scriptScheme = `javascript${":"}`;
    expect(out).not.toContain(scriptScheme);
    expect(out).not.toContain('href="javascript');
  });

  it("keeps safe https / root-relative / hash hrefs", () => {
    const out = sanitizeHtml(
      '<a href="https://movie.douban.com/">a</a><a href="/p">b</a><a href="#c">c</a>'
    );
    expect(out).toContain('href="https://movie.douban.com/"');
    expect(out).toContain('href="/p"');
    expect(out).toContain('href="#c"');
  });

  it("keeps allowed tags and image attributes", () => {
    const out = sanitizeHtml(
      '<p>文字</p><img src="https://img1.doubanio.com/x.jpg" alt="图" width="60" onerror="evil()" />'
    );
    expect(out).toContain("<p>文字</p>");
    expect(out).toContain('src="https://img1.doubanio.com/x.jpg"');
    expect(out).toContain('alt="图"');
    expect(out).toContain('width="60"');
    expect(out).not.toContain("onerror");
  });

  it("unwraps non-allowed tags but keeps their text", () => {
    const out = sanitizeHtml("<p>前 <blink>中间</blink> 后</p>");
    expect(out).toContain("前");
    expect(out).toContain("中间");
    expect(out).toContain("后");
    expect(out).not.toContain("<blink");
  });

  it("is idempotent on already-sanitized input", () => {
    const once = sanitizeHtml('<p class="a">hi</p>');
    const twice = sanitizeHtml(once);
    expect(twice).toBe(once);
  });
});

describe(HtmlContent, () => {
  it("renders external HTML through the sanitizer", () => {
    const root = renderHtml(
      '<p>安全</p><script>alert(1)</script><img src="x" onerror="evil()">'
    );
    const html = root.innerHTML;
    expect(html).toContain("安全");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
    expect(html).not.toContain("onerror");
  });

  it("renders children when no html prop is given", () => {
    const root = document.createElement("div");
    render(
      <HtmlContent>
        <span>信任内容</span>
      </HtmlContent>,
      root
    );
    expect(root.innerHTML).toContain("信任内容");
  });

  it("never lets a raw dangerouslySetInnerHTML prop bypass the sanitizer", () => {
    const root = renderHtml("<p>safe</p>");
    // Simulate a caller trying to smuggle raw HTML through the raw prop.
    render(
      <HtmlContent
        html="<p>safe</p>"
        // oxlint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: "<script>alert(1)</script>" }}
      />,
      root
    );
    const html = root.innerHTML;
    expect(html).toContain("safe");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
  });
});

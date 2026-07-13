import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as reviewContent from "@/modules/subject-page/reviews/use-review-content";

const ReviewContentProbe = ({ rid }: { rid: string }) => {
  const content = reviewContent.useReviewContent(rid);
  return (
    <output data-html={content.html ?? ""} data-status={content.status}>
      {content.html ?? ""}
    </output>
  );
};

const renderProbe = (rid: string): HTMLElement => {
  const root = document.createElement("div");
  render(<ReviewContentProbe rid={rid} />, root);
  return root;
};

const expectHtml = (html: string, ...patterns: string[]) => {
  for (const p of patterns) {
    expect(html).toContain(p);
  }
};

describe("Review content", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("exposes only the review-content interface", () => {
    expect(Object.keys(reviewContent)).toStrictEqual(["useReviewContent"]);
  });

  it("uses sanitized native review content without fetching", async () => {
    document.body.innerHTML = `
      <article id="review_42">
        <div id="review_42_full"><div class="review-content"><p style="color:red">完整正文 <a href="data:text/html;base64,AA==">链接</a><script>alert(1)</script></p></div></div>
      </article>
    `;
    const fetch = vi.fn<() => Promise<Response>>();
    vi.stubGlobal("fetch", fetch);
    const root = renderProbe("review_42");

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("loaded")
    );

    expect(root.querySelector("output")?.textContent).toContain("完整正文");
    expect(root.querySelector("output")?.dataset.html).not.toContain("style=");
    expect(root.querySelector("output")?.dataset.html).not.toContain("data:");
    expect(root.querySelector("output")?.dataset.html).not.toContain(
      "alert(1)"
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("falls back to sanitized remote content when native content is absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<() => Promise<Response>>(() =>
        Promise.resolve(
          new Response(
            '<div class="review-content"><p style="color:red">远端正文</p></div>',
            { status: 200 }
          )
        )
      )
    );
    const root = renderProbe("review_99");

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("loaded")
    );

    expect(root.querySelector("output")?.textContent).toContain("远端正文");
    expect(root.querySelector("output")?.dataset.html).not.toContain("style=");
  });

  it("preserves img tags in sanitized review content", async () => {
    document.body.innerHTML = `
      <article id="review_43">
        <div id="review_43_full">
          <div class="review-content">
            <p>正文文字</p>
            <div class="image-container">
              <div class="image-wrapper">
                <img src="https://img1.doubanio.com/view/thing_review/l/public/p123.jpg" alt="剧照" width="600" />
              </div>
              <div class="image-caption-wrapper">
                <span class="image-caption">说明文字</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
    const fetch = vi.fn<() => Promise<Response>>();
    vi.stubGlobal("fetch", fetch);
    const root = renderProbe("review_43");

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("loaded")
    );

    const html = root.querySelector("output")?.dataset.html ?? "";
    expectHtml(
      html,
      'src="https://img1.doubanio.com/',
      "<img",
      'class="image-container"',
      'class="image-wrapper"',
      'class="image-caption"'
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves blockquote with cite and footer in sanitized review content", async () => {
    document.body.innerHTML = `
      <article id="review_44">
        <div id="review_44_full">
          <div class="review-content">
            <blockquote>
              <p>这是一段引用文字</p>
              <cite>某影评人</cite>
            </blockquote>
            <blockquote>
              <p>另一段引用</p>
              <footer>来源</footer>
            </blockquote>
          </div>
        </div>
      </article>
    `;
    const fetch = vi.fn<() => Promise<Response>>();
    vi.stubGlobal("fetch", fetch);
    const root = renderProbe("review_44");

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("loaded")
    );

    const html = root.querySelector("output")?.dataset.html ?? "";
    expectHtml(html, "<blockquote", "<cite>", "<footer>", "某影评人", "来源");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves headings, horizontal rule, and text-level semantic tags", async () => {
    document.body.innerHTML = `
      <article id="review_45">
        <div id="review_45_full">
          <div class="review-content">
            <h4>四级标题</h4>
            <h5>五级标题</h5>
            <h6>六级标题</h6>
            <hr />
            <p>普通文字 <small>小字</small> <q>行内引用</q></p>
            <p><u>下划线</u> <s>删除线</s> <del>已删除</del></p>
            <p>上标<sup>注</sup> 下标<sub>释</sub></p>
          </div>
        </div>
      </article>
    `;
    const fetch = vi.fn<() => Promise<Response>>();
    vi.stubGlobal("fetch", fetch);
    const root = renderProbe("review_45");

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("loaded")
    );

    const html = root.querySelector("output")?.dataset.html ?? "";
    expectHtml(
      html,
      "<h4>",
      "<h5>",
      "<h6>",
      "<hr",
      "<small>",
      "<q>",
      "<u>",
      "<s>",
      "<del>",
      "<sup>",
      "<sub>"
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves table structure with colspan and rowspan", async () => {
    document.body.innerHTML = `
      <article id="review_46">
        <div id="review_46_full">
          <div class="review-content">
            <table class="some-table">
              <thead>
                <tr>
                  <th scope="col">片名</th>
                  <th scope="col">年份</th>
                  <th colspan="2">评分</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>肖申克的救赎</td>
                  <td>1994</td>
                  <td>9.7</td>
                  <td rowspan="2">高分</td>
                </tr>
                <tr>
                  <td>教父</td>
                  <td>1972</td>
                  <td>9.3</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>
    `;
    const fetch = vi.fn<() => Promise<Response>>();
    vi.stubGlobal("fetch", fetch);
    const root = renderProbe("review_46");

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("loaded")
    );

    const html = root.querySelector("output")?.dataset.html ?? "";
    expectHtml(
      html,
      "<table",
      "<thead>",
      "<tbody>",
      "<tr>",
      "<th",
      "<td",
      'scope="col"',
      'colspan="2"',
      'rowspan="2"',
      'class="some-table"',
      "肖申克的救赎",
      "教父"
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports error when neither adapter yields review content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<() => Promise<Response>>(() =>
        Promise.resolve(new Response("", { status: 404 }))
      )
    );
    const root = renderProbe("review_404");

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("error")
    );
  });

  it("reports error when the remote page lacks review content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<() => Promise<Response>>(() =>
        Promise.resolve(new Response("<p>not a review</p>", { status: 200 }))
      )
    );
    const root = renderProbe("review_malformed");

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("error")
    );
  });

  it("does not apply remote content after the caller unmounts", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const fetch = vi.fn<() => Promise<Response>>(
      () =>
        // oxlint-disable-next-line promise/avoid-new -- the test controls an in-flight adapter response.
        new Promise((resolve) => {
          resolveResponse = resolve;
        })
    );
    vi.stubGlobal("fetch", fetch);
    const root = renderProbe("review_late");
    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.status).toBe("loading")
    );
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());

    render(<div>replacement</div>, root);
    if (!resolveResponse) {
      throw new Error("remote adapter did not begin its request");
    }
    resolveResponse(
      new Response('<div class="review-content">过期正文</div>', {
        status: 200,
      })
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(root.textContent).toBe("replacement");
  });
});

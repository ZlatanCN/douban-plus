import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import {
  makeData,
  mockGmXmlHttpRequest,
  mockNetwork,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("subject runtime basics", () => {
  setupSubjectRuntimeHooks();

  it("renders the page from a Douban document without leaking that document into Subject page", () => {
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    expect(root.querySelector(".atv-hero")).not.toBeNull();
    expect(root.querySelector(".atv-footer-spacer")).not.toBeNull();
  });

  it("updates an open comment modal when its profile avatar resolves", async () => {
    const profileLink = "https://www.douban.com/people/runtime-modal/";
    const rawAvatarUrl = "https://example.com/runtime-modal-raw.jpg";
    const avatarUrl = "https://example.com/runtime-modal-resolved.jpg";
    const response = Promise.withResolvers<string>();
    mockNetwork((url) =>
      url === profileLink
        ? response.promise.then((body) => ({ body }))
        : { body: "", status: 404 }
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={makeData({
          comments: [
            {
              avatar: rawAvatarUrl,
              cid: "runtime-modal",
              content: "打开后更新头像",
              link: profileLink,
              name: "Runtime modal viewer",
              ratingWord: "推荐",
              stars: 4,
              time: "2026-07-16",
              voted: false,
              votes: 1,
            },
          ],
        })}
        doc={document}
      />
    );

    await vi.waitFor(() =>
      expect(
        mockGmXmlHttpRequest.mock.calls.some(
          ([request]) => request.url === profileLink
        )
      ).toBeTruthy()
    );
    root.querySelector<HTMLButtonElement>(".atv-comment-expand")?.click();
    await Promise.resolve();

    expect(
      root
        .querySelector<HTMLElement>(".atv-comment-overlay-avatar")
        ?.getAttribute("style")
    ).toBe(`background-image: url("${rawAvatarUrl}");`);

    response.resolve(
      `<div id="profile"><div class="pic"><img src="${avatarUrl}" /></div></div>`
    );

    await vi.waitFor(() =>
      expect([
        root
          .querySelector<HTMLElement>(
            "[data-cid='runtime-modal'] .atv-comment-avatar"
          )
          ?.getAttribute("style"),
        root
          .querySelector<HTMLElement>(".atv-comment-overlay-avatar")
          ?.getAttribute("style"),
      ]).toStrictEqual([
        `background-image: url("${avatarUrl}");`,
        `background-image: url("${avatarUrl}");`,
      ])
    );
  });

  it("loads first-broadcast data through the runtime for a signed-in viewer", async () => {
    const editPage = `
        <div class="item basic">
          <label for="p_142">电视台</label>
          <input id="p_142" value="Apple TV+" readonly />
        </div>
      `;
    mockNetwork((url) =>
      url === "https://movie.douban.com/subject/36858672/edit"
        ? { body: editPage }
        : { body: "", status: 404 }
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={makeData({
          interest: { ...makeData().interest, loggedIn: true },
          subjectId: "36858672",
        })}
        doc={document}
      />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-first-broadcast-platform")).not.toBeNull()
    );

    expect(mockGmXmlHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "https://movie.douban.com/subject/36858672/edit",
      })
    );
  });
});

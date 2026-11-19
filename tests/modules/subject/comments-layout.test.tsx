import { readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "postcss";
import type { AtRule, ChildNode, Declaration, Rule } from "postcss";
import { describe, expect, it } from "vitest";

import { CommentsSection } from "@/modules/subject/comments";
import type { Comment } from "@/modules/subject/domain";

import { renderIntoRoot } from "../../helpers/render";

const commentsCss = parse(
  readFileSync(
    path.resolve(process.cwd(), "src/modules/subject/styles/comments.css"),
    "utf-8"
  )
);
const responsiveCss = parse(
  readFileSync(
    path.resolve(process.cwd(), "src/modules/subject/styles/responsive.css"),
    "utf-8"
  )
);

const findRule = (
  nodes: readonly ChildNode[] | undefined,
  selector: string
): Rule | undefined =>
  nodes?.find(
    (node): node is Rule => node.type === "rule" && node.selector === selector
  );

const declarationsOf = (rule: Rule | undefined) =>
  Object.fromEntries(
    (rule?.nodes ?? [])
      .filter((node): node is Declaration => node.type === "decl")
      .map(({ prop, value }) => [prop, value])
  );

const makeComment = (index: number): Comment => ({
  avatar: "",
  cid: `comment-${index}`,
  content: `Preview ${index}`,
  link: "",
  name: `Viewer ${index}`,
  ratingWord: "",
  stars: 0,
  time: "2024-01-15",
  voted: false,
  votes: index,
});

describe("CommentsSection layout", () => {
  it("keeps five previews in order in equal desktop columns with natural card heights", () => {
    const root = renderIntoRoot(
      <CommentsSection
        comments={[1, 2, 3, 4, 5].map(makeComment)}
        onOpen={(comment) => comment.cid}
        onVote={() => Promise.resolve({ ok: true })}
        subjectId="1292052"
      />
    );
    const grid = root.querySelector<HTMLElement>(".atv-comments");
    const cards = [
      ...(grid?.querySelectorAll<HTMLElement>(".atv-comment-card") ?? []),
    ];
    const desktopLayout = declarationsOf(
      findRule(commentsCss.nodes, ".atv-comments")
    );
    const mobileQuery = responsiveCss.nodes.find(
      (node): node is AtRule =>
        node.type === "atrule" &&
        node.name === "media" &&
        node.params === "(width <= 768px)"
    );
    const mobileLayout = declarationsOf(
      findRule(mobileQuery?.nodes, ".atv-comments")
    );
    const previewStyle = declarationsOf(
      findRule(commentsCss.nodes, ".atv-comment-body-text")
    );

    expect(cards.map((card) => card.dataset.cid)).toStrictEqual([
      "comment-1",
      "comment-2",
      "comment-3",
      "comment-4",
      "comment-5",
    ]);
    expect({
      display: desktopLayout.display,
      columns: desktopLayout["grid-template-columns"],
      alignment: desktopLayout["align-items"],
      narrowColumns: mobileLayout["grid-template-columns"],
      previewLines: previewStyle["-webkit-line-clamp"],
    }).toStrictEqual({
      display: "grid",
      columns: "repeat(2, minmax(0, 1fr))",
      alignment: "start",
      narrowColumns: "1fr",
      previewLines: "4",
    });
  });
});

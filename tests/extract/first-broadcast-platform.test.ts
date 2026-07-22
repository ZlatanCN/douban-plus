import { describe, expect, it } from "vitest";

import { extractFirstBroadcastPlatform } from "@/modules/subject/extract/first-broadcast-platform";

import { buildDoc } from "../helpers/doc";

describe(extractFirstBroadcastPlatform, () => {
  it("extracts the TV network from a signed-in edit form", () => {
    const doc = buildDoc(`
      <fieldset>
        <div class="item basic">
          <label for="p_142">电视台</label>
          <input name="tracking" type="hidden" value="not a platform" />
          <input id="p_142" name="p_142" value=" Apple TV+ " readonly />
        </div>
      </fieldset>
    `);

    expect(extractFirstBroadcastPlatform(doc)).toBe("Apple TV+");
  });

  it("returns null when the edit form has no broadcast platform", () => {
    const doc = buildDoc(`
      <fieldset>
        <div class="item basic">
          <label for="p_142">电视台</label>
          <input id="p_142" name="p_142" value="" readonly />
        </div>
      </fieldset>
    `);

    expect(extractFirstBroadcastPlatform(doc)).toBeNull();
  });

  it("returns null for pages without the edit-form field", () => {
    const doc = buildDoc("<main>请登录</main>");

    expect(extractFirstBroadcastPlatform(doc)).toBeNull();
  });
});

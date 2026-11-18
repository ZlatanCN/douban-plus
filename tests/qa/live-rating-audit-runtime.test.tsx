import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import type { RatingUpdate } from "@/modules/subject/resolve/orchestrate";
import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";
import { readSubjectData } from "@/modules/subject/runtime/read-subject-data";

import sampleManifest from "../fixtures/external-ratings/v1/manifest.json";
import { renderIntoRoot } from "../helpers/render";
import { setupSubjectRuntimeHooks } from "../runtime/subject-runtime-test-utils";
import {
  writeAuditReport,
  rowsFromDiagnostics,
  unverifiedRows,
} from "./live-rating-audit-report";
import { installFetchBackedGmTransport } from "./live-rating-audit-transport";
import type {
  AuditRow,
  DiagnosticRecord,
  NetworkObservation,
} from "./live-rating-audit-types";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

const liveAuditEnabled = process.env.DP_LIVE_RATING_AUDIT === "1";

describe.skipIf(!liveAuditEnabled)("opt-in live rating audit", () => {
  setupSubjectRuntimeHooks();

  it("writes pass/fail/unverified outcomes from the runtime callback", async () => {
    const checkedAt = new Date().toISOString();
    const rows: AuditRow[] = [];
    const outcomes = new Map<RatingUpdate["source"], RatingUpdate>();
    const observations: NetworkObservation[] = [];
    const onRatingUpdate = (update: RatingUpdate): void => {
      outcomes.set(update.source, update);
    };
    installFetchBackedGmTransport(observations);

    for (const sample of sampleManifest.samples) {
      outcomes.clear();
      let snapshot: Awaited<ReturnType<typeof readSubjectData>>;
      try {
        // eslint-disable-next-line no-await-in-loop -- each live sample has its own runtime outcomes.
        snapshot = await readSubjectData(sample.work.doubanSubjectId);
      } catch {
        rows.push(
          ...unverifiedRows(
            sample,
            checkedAt,
            "douban-source-unavailable",
            "douban-extraction"
          )
        );
        continue;
      }

      const root = renderIntoRoot(
        <SubjectPageRuntime
          data={snapshot.data}
          doc={document}
          onRatingUpdate={onRatingUpdate}
        />
      );
      try {
        // eslint-disable-next-line no-await-in-loop -- wait for each sample's three typed outcomes before unmounting.
        await vi.waitFor(
          () => {
            if (
              outcomes.size !== 3 ||
              [...outcomes.values()].some(
                ({ result }) => result.status !== "resolved"
              )
            ) {
              throw new Error("Not all rating outcomes have resolved");
            }
          },
          { interval: 250, timeout: 60_000 }
        );
      } catch {
        rows.push(
          ...unverifiedRows(
            sample,
            checkedAt,
            "runtime-outcomes-incomplete",
            "runtime"
          )
        );
        render(null, root);
        continue;
      }

      const records: DiagnosticRecord[] = [...outcomes.values()].flatMap(
        ({ result, source }) =>
          result.diagnostic ? [{ ...result.diagnostic, source }] : []
      );
      rows.push(
        ...rowsFromDiagnostics(sample, checkedAt, records, observations, {
          imdb: Boolean(
            root
              .querySelector(".atv-rating-panel-imdb .atv-rating-panel-score")
              ?.textContent?.trim()
          ),
          mc: Boolean(
            root
              .querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
              ?.textContent?.trim()
          ),
          rt: [...root.querySelectorAll(".atv-rt-score-value")].some((node) =>
            Boolean(node.textContent?.trim())
          ),
        })
      );
      render(null, root);
    }

    const reportPath = await writeAuditReport(rows);
    console.info(`Live rating audit report: ${reportPath}`);
    expect(rows.some((row) => row.status === "fail")).toBeFalsy();
  }, 90_000);
});

import type {
  ExternalRatingDiagnostic,
  ExternalRatingReason,
} from "@/modules/subject/api/external-ratings/outcome";
import type { RtObjectKind } from "@/modules/subject/domain";

import { getUserscriptApi } from "./rating-diagnostics-api";
import type {
  MenuCommandId,
  RatingDiagnosticsApi,
} from "./rating-diagnostics-api";
import {
  createRatingDiagnosticsReportText,
  sanitizeRatingDiagnosticRecord,
  showSelectableReport,
} from "./rating-diagnostics-report";

type RatingDiagnosticRecord = ExternalRatingDiagnostic & {
  hasRating: boolean;
  source: "imdb" | "mc" | "rt";
};

type RatingDiagnosticPage = {
  imdbId: string | null;
  kind: RtObjectKind;
  season: number | null;
  subjectId: string;
};

type RatingDiagnostics = {
  beginPage: (page: RatingDiagnosticPage) => void;
  initialize: () => Promise<boolean>;
  record: (record: RatingDiagnosticRecord) => void;
  dispose: () => void;
};

const STORAGE_KEY = "dp:rating-diagnostics-enabled";
const MAX_RECORDS = 3;
const DIAGNOSTIC_STAGES = new Set<ExternalRatingDiagnostic["stage"]>([
  "cache",
  "identity",
  "mapping",
  "parse",
  "rating",
  "request",
]);
const DIAGNOSTIC_REASONS = new Set<ExternalRatingReason>([
  "cancelled",
  "identity-conflict",
  "mapping-missing",
  "parse-error",
  "rating",
  "request-error",
  "source-no-rating",
]);

const createRatingDiagnostics = (
  api: RatingDiagnosticsApi | undefined
): RatingDiagnostics => {
  let enabled = false;
  let page: RatingDiagnosticPage | null = null;
  let initialization: Promise<boolean> | undefined;
  let commandIds: MenuCommandId[] = [];
  let commandVersion = 0;
  let disposed = false;
  const records = new Map<
    RatingDiagnosticRecord["source"],
    RatingDiagnosticRecord
  >();

  const reportText = (): string =>
    createRatingDiagnosticsReportText(page, [...records.values()]);

  const copyReport = async (): Promise<void> => {
    if (disposed) {
      return;
    }
    const text = reportText();
    try {
      if (api?.setClipboard) {
        await api.setClipboard(text, "text");
      } else if (globalThis.navigator.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(text);
      } else {
        throw new Error("clipboard-unavailable");
      }
    } catch {
      showSelectableReport(text);
    }
  };

  const registerCommands = async (): Promise<void> => {
    if (!api || disposed) {
      return;
    }
    commandVersion += 1;
    const version = commandVersion;
    const previousIds = commandIds;
    commandIds = [];
    await Promise.all(
      previousIds.map(async (id) => {
        try {
          await api.unregisterMenuCommand(id);
        } catch {
          // Menu cleanup is optional; rating acquisition does not depend on it.
        }
      })
    );
    const registrations = [
      () =>
        api.registerMenuCommand(
          `评分诊断：${enabled ? "关闭" : "开启"}`,
          () => {
            void setEnabled(!enabled);
          }
        ),
      () =>
        api.registerMenuCommand("评分诊断：复制本页报告", () => {
          void copyReport();
        }),
    ];
    const registered = await Promise.all(
      registrations.map(async (register) => {
        try {
          return await register();
        } catch {
          return null;
        }
      })
    );
    const ids = registered.filter((id): id is MenuCommandId => id !== null);
    if (version === commandVersion) {
      commandIds = ids;
    } else {
      await Promise.all(
        ids.map(async (id) => {
          try {
            await api.unregisterMenuCommand(id);
          } catch {
            // The current menu registration remains usable.
          }
        })
      );
    }
  };

  const setEnabled = async (nextEnabled: boolean): Promise<void> => {
    if (disposed) {
      return;
    }
    enabled = nextEnabled;
    if (!enabled) {
      records.clear();
    }
    try {
      await api?.setValue(STORAGE_KEY, enabled);
    } catch {
      // Diagnostics are optional; the current page still reflects the choice.
    }
    await registerCommands();
  };

  const initialize = (): Promise<boolean> => {
    if (!initialization) {
      initialization = (async () => {
        if (api) {
          try {
            enabled = (await api.getValue(STORAGE_KEY, false)) === true;
          } catch {
            enabled = false;
          }
          if (disposed) {
            return false;
          }
          void registerCommands();
        }
        return enabled;
      })();
    }
    return initialization;
  };

  return {
    beginPage: (nextPage) => {
      disposed = false;
      page = nextPage;
      records.clear();
    },
    initialize,
    record: (record) => {
      if (
        disposed ||
        !enabled ||
        !DIAGNOSTIC_STAGES.has(record.stage) ||
        !DIAGNOSTIC_REASONS.has(record.reason)
      ) {
        return;
      }
      records.set(record.source, sanitizeRatingDiagnosticRecord(record));
      while (records.size > MAX_RECORDS) {
        const oldest = records.keys().next().value;
        if (oldest === undefined) {
          break;
        }
        records.delete(oldest);
      }
    },
    dispose: () => {
      disposed = true;
      records.clear();
      page = null;
      enabled = false;
      commandVersion += 1;
      void Promise.all(
        commandIds.map(async (id) => {
          try {
            await api?.unregisterMenuCommand(id);
          } catch {
            // The page is leaving; no action is needed.
          }
        })
      );
      commandIds = [];
    },
  };
};

export { createRatingDiagnostics, getUserscriptApi };
export type {
  RatingDiagnosticPage,
  ExternalRatingReason as RatingDiagnosticReason,
  RatingDiagnosticRecord,
  RatingDiagnostics,
};

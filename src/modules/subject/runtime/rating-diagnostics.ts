import type {
  ExternalRatingDiagnostic,
  ExternalRatingReason,
} from "@/modules/subject/api/external-ratings/outcome";
import type { RtObjectKind } from "@/modules/subject/domain";

import packageJson from "../../../../package.json";

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

type MenuCommandId = number | string;
type RatingDiagnosticsApi = {
  getValue: (key: string, defaultValue: unknown) => Promise<unknown>;
  registerMenuCommand: (
    caption: string,
    onClick: () => void
  ) => MenuCommandId | Promise<MenuCommandId>;
  setValue: (key: string, value: boolean) => Promise<void>;
  unregisterMenuCommand: (id: MenuCommandId) => void | Promise<void>;
  setClipboard?: (text: string, type?: string) => void | Promise<void>;
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

const getUserscriptApi = (): RatingDiagnosticsApi | undefined => {
  const globals = globalThis as typeof globalThis & {
    GM?: RatingDiagnosticsApi;
    GM_setClipboard?: (text: string, type?: string) => void;
  };
  const gm = globals.GM;
  if (
    !gm ||
    typeof gm.getValue !== "function" ||
    typeof gm.setValue !== "function" ||
    typeof gm.registerMenuCommand !== "function" ||
    typeof gm.unregisterMenuCommand !== "function"
  ) {
    return undefined;
  }
  const { setClipboard: gmClipboard } = gm;
  let setClipboard: RatingDiagnosticsApi["setClipboard"];
  if (typeof gmClipboard === "function") {
    setClipboard = gmClipboard;
  } else if (typeof globals.GM_setClipboard === "function") {
    setClipboard = globals.GM_setClipboard;
  }
  return {
    getValue: gm.getValue,
    registerMenuCommand: gm.registerMenuCommand,
    setValue: gm.setValue,
    unregisterMenuCommand: gm.unregisterMenuCommand,
    ...(setClipboard ? { setClipboard } : {}),
  };
};

const safeErrorCode = (value: string | null): string | null =>
  value !== null && /^[a-z0-9-]{1,64}$/u.test(value) ? value : null;

const safeTarget = (value: string | null): string | null =>
  value !== null &&
  /^[a-z0-9][a-z0-9._/-]{0,119}$/iu.test(value) &&
  !value.split("/").includes("..")
    ? value
    : null;

const reportWork = (page: RatingDiagnosticPage | null) => {
  if (page === null) {
    return null;
  }
  const { imdbId: pageImdbId, kind, season: pageSeason, subjectId } = page;
  let imdbId: string | null = null;
  let season: number | null = null;
  if (pageImdbId !== null && /^tt\d{5,16}$/u.test(pageImdbId)) {
    imdbId = pageImdbId;
  }
  if (
    pageSeason !== null &&
    Number.isSafeInteger(pageSeason) &&
    pageSeason > 0
  ) {
    season = pageSeason;
  }
  return {
    imdbId,
    kind,
    season,
    subjectId: /^\d{1,32}$/u.test(subjectId) ? subjectId : null,
  };
};

const showSelectableReport = (text: string): void => {
  const { body } = document;
  if (!body) {
    return;
  }
  body.querySelector("#dp-rating-diagnostics-copy")?.remove();
  const panel = document.createElement("section");
  panel.id = "dp-rating-diagnostics-copy";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "评分诊断报告");
  Object.assign(panel.style, {
    background: "#fff",
    border: "1px solid #777",
    borderRadius: "8px",
    boxShadow: "0 8px 32px #0005",
    color: "#111",
    inset: "auto 16px 16px auto",
    maxWidth: "min(680px, calc(100vw - 32px))",
    padding: "12px",
    position: "fixed",
    zIndex: "2147483647",
  });

  const label = document.createElement("label");
  label.htmlFor = "dp-rating-diagnostics-copy-text";
  label.textContent = "剪贴板不可用。请复制以下本页评分诊断报告。";
  const textarea = document.createElement("textarea");
  textarea.id = label.htmlFor;
  textarea.readOnly = true;
  textarea.rows = 14;
  textarea.value = text;
  textarea.setAttribute("aria-label", "可复制的本页评分诊断报告");
  Object.assign(textarea.style, {
    display: "block",
    fontFamily: "monospace",
    marginBlock: "8px",
    width: "min(640px, calc(100vw - 64px))",
  });
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "关闭";
  close.addEventListener("click", () => panel.remove());
  panel.append(label, textarea, close);
  body.append(panel);
  textarea.focus();
  textarea.select();
};

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
    JSON.stringify(
      {
        scriptVersion: packageJson.version,
        work: reportWork(page),
        records: ["imdb", "mc", "rt"]
          .map((source) =>
            records.get(source as RatingDiagnosticRecord["source"])
          )
          .filter(
            (record): record is RatingDiagnosticRecord => record !== undefined
          ),
      },
      null,
      2
    );

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
      records.set(record.source, {
        ...record,
        cacheAgeMs:
          record.cacheAgeMs !== null &&
          Number.isFinite(record.cacheAgeMs) &&
          record.cacheAgeMs >= 0
            ? record.cacheAgeMs
            : null,
        errorCode: safeErrorCode(record.errorCode),
        target: safeTarget(record.target),
      });
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

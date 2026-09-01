type CssSource = {
  lineOffset?: number;
  path: string;
  text: string;
};

type AuditFinding = {
  dependencies?: string[];
  file?: string;
  kind: string;
  line?: number;
  name?: string;
  prop?: string;
  reason?: string;
  ruleId?: string;
  selector?: string;
};

type AuditResult = {
  errors: { file: string; line?: number; message: string }[];
  findings: AuditFinding[];
  unverified: AuditFinding[];
};

declare const analyzeSources: (input: {
  cssSources: CssSource[];
  runtimeSources?: CssSource[];
}) => AuditResult;

export { analyzeSources };

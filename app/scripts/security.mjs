#!/usr/bin/env node
// Security audit: runs rnsec and `npm audit` on app/, then compares the findings with
// security/rnsec-baseline.json. Fails on HIGH findings missing from the baseline; other new
// or resolved findings are warnings.
// Usage: node scripts/security.mjs [--reports <dir>] [--update]
//   --reports  folder for the rnsec JSON, Markdown and HTML reports (default: rnsec-reports)
//   --update   write the current findings as the new baseline instead of comparing
//
// rnsec runs `npm audit` itself with a fixed 10 s timeout, which is too short on CI runners,
// so .rnsec.json sets `dataSource: "hardcoded"` (rnsec keeps its offline package checks) and
// this script runs `npm audit` instead.
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(import.meta.dirname, '..');
const BASELINE = join(ROOT, 'security/rnsec-baseline.json');
const RNSEC = join(ROOT, 'node_modules/rnsec/dist/index.js');
const NPM_RULE = 'NPM_VULNERABLE_DEPENDENCY';
const NPM_AUDIT_TIMEOUT = 120_000;
const NPM_SEVERITY = { critical: 'HIGH', high: 'HIGH', moderate: 'MEDIUM' };
// npm is a .cmd shim on Windows, which spawnSync only finds through a shell.
const SHELL = process.platform === 'win32';

const keyOf = (ruleId, file, description) => [ruleId, file, description].join(' | ');

const scan = () => {
  const json = join(reports, 'rnsec.json');
  // A stale report would hide a failed scan.
  rmSync(json, { force: true });
  // Exit code 1 means HIGH findings or an error: rely on the JSON report instead.
  const result = spawnSync(
    process.execPath,
    [
      RNSEC,
      'scan',
      '--path',
      ROOT,
      '--output',
      json,
      '--md',
      join(reports, 'rnsec.md'),
      '--html',
      join(reports, 'rnsec.html'),
      '--silent',
    ],
    { cwd: ROOT, stdio: 'ignore' }
  );
  if (result.error) throw result.error;
  if (!existsSync(json)) throw new Error(`rnsec wrote no report (exit ${result.status}).`);
  const { findings } = JSON.parse(readFileSync(json, 'utf8'));
  return findings.map((f) => {
    const file = relative(ROOT, f.filePath).replaceAll('\\', '/');
    // The line is left out of the key: it moves with unrelated edits.
    return {
      key: keyOf(f.ruleId, file, f.description),
      ruleId: f.ruleId,
      severity: f.severity,
      file,
      description: f.description,
    };
  });
};

// Same findings as rnsec's own npm audit: direct dependencies only, same description and severity.
const audit = () => {
  const result = spawnSync('npm', ['audit', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: NPM_AUDIT_TIMEOUT,
    maxBuffer: 64 * 1024 * 1024,
    shell: SHELL,
  });
  writeFileSync(join(reports, 'npm-audit.json'), result.stdout ?? '');
  let output;
  try {
    output = JSON.parse(result.stdout);
  } catch {
    output = undefined;
  }
  if (result.error || !output?.vulnerabilities) {
    warnings.push(
      `npm audit failed (${auditError(result, output)}); dependency findings were not checked.`
    );
    // Keep the baseline entries so they are not reported as resolved.
    return baseline.filter((f) => f.ruleId === NPM_RULE).map((f) => ({ ...f, unchecked: true }));
  }
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const direct = { ...pkg.dependencies, ...pkg.devDependencies };
  return Object.entries(output.vulnerabilities)
    .filter(([name]) => direct[name])
    .map(([name, vuln]) => {
      const via = vuln.via?.[0];
      const title = typeof via === 'object' ? via.title : undefined;
      const description = `${title ?? `Vulnerability in ${name}`} (${vuln.severity})`;
      return {
        key: keyOf(NPM_RULE, 'package.json', description),
        ruleId: NPM_RULE,
        severity: NPM_SEVERITY[vuln.severity] ?? 'LOW',
        file: 'package.json',
        description,
      };
    });
};

const auditError = (result, output) => {
  if (result.error?.code === 'ETIMEDOUT') return `timed out after ${NPM_AUDIT_TIMEOUT / 1000} s`;
  if (result.error) return result.error.message;
  if (output?.error?.summary) return output.error.summary;
  return `exited with ${result.status}`;
};

const rnsecVersion = () =>
  JSON.parse(readFileSync(join(ROOT, 'node_modules/rnsec/package.json'), 'utf8')).version;

const report = () => {
  const ci = !!process.env.GITHUB_ACTIONS;
  const line = (f) => `${f.severity} ${f.ruleId} in ${f.file}: ${f.description}`;
  const annotate = (level, text) =>
    console.log(ci ? `::${level} title=rnsec::${text}` : `${level}: ${text}`);

  newHigh.forEach((f) => annotate('error', `New: ${line(f)}`));
  added.filter((f) => f.severity !== 'HIGH').forEach((f) => annotate('warning', `New: ${line(f)}`));
  resolved.forEach((f) => annotate('warning', `Resolved, remove from the baseline: ${line(f)}`));
  warnings.forEach((w) => annotate('warning', w));

  const summary = [
    '## Security audit (rnsec)',
    '',
    `${current.length} finding(s), ${added.length} new (${newHigh.length} HIGH), ${resolved.length} resolved against the baseline.`,
    ...(newHigh.length
      ? [
          '',
          'New HIGH findings fail this job. Fix them, or accept them with `npm run security:baseline` in this PR.',
        ]
      : []),
    ...section('New', added),
    ...section('Resolved (run `npm run security:baseline`)', resolved),
    ...(warnings.length ? ['', '### Warnings', '', ...warnings.map((w) => `- ${w}`)] : []),
    '',
  ].join('\n');
  console.log(`\n${summary}`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
};

const section = (title, findings) => {
  if (!findings.length) return [];
  return [
    '',
    `### ${title}`,
    '',
    '| Severity | Rule | File | Description |',
    '| --- | --- | --- | --- |',
    ...findings.map((f) => `| ${f.severity} | ${f.ruleId} | ${f.file} | ${f.description} |`),
  ];
};

const { values } = parseArgs({
  options: {
    reports: { type: 'string', default: 'rnsec-reports' },
    update: { type: 'boolean', default: false },
  },
});
const reports = resolve(ROOT, values.reports);
mkdirSync(reports, { recursive: true });

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')).findings : [];
const warnings = [];
const current = [...scan(), ...audit()];

if (values.update) {
  const findings = current
    .map(({ unchecked: _, ...f }) => f)
    .sort((a, b) => a.key.localeCompare(b.key));
  mkdirSync(dirname(BASELINE), { recursive: true });
  writeFileSync(BASELINE, `${JSON.stringify({ rnsec: rnsecVersion(), findings }, null, 2)}\n`);
  console.log(`Baseline updated: ${findings.length} finding(s) in ${relative(ROOT, BASELINE)}`);
  warnings.forEach((w) => console.log(`warning: ${w}`));
  process.exit(0);
}

const known = new Set(baseline.map((f) => f.key));
const found = new Set(current.map((f) => f.key));
const added = current.filter((f) => !known.has(f.key));
const resolved = baseline.filter((f) => !found.has(f.key));
const newHigh = added.filter((f) => f.severity === 'HIGH');

report();
process.exit(newHigh.length ? 1 : 0);

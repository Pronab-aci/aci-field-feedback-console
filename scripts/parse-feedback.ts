/**
 * Parses the raw ACI feedback TSV export into a clean JSON structure.
 *
 * The TSV has 9 tab-separated columns, but the feedback-text column (8) can
 * contain newlines, so a naive line-based parse fails. Instead we split the
 * whole file into records by anchoring on the trailing timestamp.
 *
 * Run:  bun run scripts/parse-feedback.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve(
  process.cwd(),
  "upload/Pasted Content_1791274851415.txt"
);
const OUT = resolve(process.cwd(), "src/lib/feedback-raw.json");

interface RawRecord {
  territory: string;
  product: string;
  feedbackType: string;
  subCategory: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  timestamp: string; // ISO-ish "2026-10-05 14:23:21.147"
  date: string; // "2026-10-05"
}

function clean(s: string): string {
  if (!s) return "";
  return s
    .replace(/\r/g, "")
    .replace(/^\s+|\s+$/g, "")
    // normalise stray double-quotes used as field text wrappers
    .replace(/^"|"$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function main() {
  const raw = readFileSync(SRC, "utf8");

  // A record ends with: \t<YYYY-MM-DD HH:MM:SS.mmm>  then newline (or EOF)
  // We walk through and slice records greedily.
  const records: RawRecord[] = [];

  // Normalise: the file uses \n. Split on the timestamp+newline boundary.
  // Pattern: capture everything up to and including a timestamp, terminated by \n or end.
  const recordRe =
    /([\s\S]*?)\t(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)\s*(?:\n|$)/g;

  let m: RegExpExecArray | null;
  let count = 0;
  while ((m = recordRe.exec(raw)) !== null) {
    const head = m[1]; // fields 1..8 (may contain newlines)
    const timestamp = m[2];
    // Split head by tab. There should be 8 fields. Some feedback text may
    // itself contain tabs (rare); we join the tail into the message field.
    const parts = head.split("\t");
    // pad to at least 8
    while (parts.length < 8) parts.push("");
    const territory = clean(parts[0]);
    const product = clean(parts[1]);
    const feedbackType = clean(parts[2]);
    const subCategory = clean(parts[3]);
    const name = clean(parts[4]);
    const email = clean(parts[5]);
    const phone = clean(parts[6]);
    // message = everything from index 7 onward, joined (handles accidental tabs)
    const message = clean(parts.slice(7).join(" "));
    const date = timestamp.slice(0, 10);

    records.push({
      territory,
      product,
      feedbackType,
      subCategory,
      name,
      email,
      phone,
      message,
      timestamp,
      date,
    });
    count++;
  }

  console.log(`Parsed ${count} records.`);

  // Quick distribution report
  const byType = new Map<string, number>();
  const byMonth = new Map<string, number>();
  for (const r of records) {
    const t = r.feedbackType || "(empty)";
    byType.set(t, (byType.get(t) ?? 0) + 1);
    const mo = r.date.slice(0, 7);
    byMonth.set(mo, (byMonth.get(mo) ?? 0) + 1);
  }
  console.log("By feedback type:", Object.fromEntries(byType));
  console.log(
    "By month:",
    Object.fromEntries([...byMonth.entries()].sort())
  );

  writeFileSync(OUT, JSON.stringify(records, null, 2), "utf8");
  console.log(`Wrote ${OUT}`);
}

main();

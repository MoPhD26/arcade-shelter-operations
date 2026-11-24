// Builds docs/CATALOG.md from the header comment of every expression.
// Run with --check in CI to fail when the catalog is out of date.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const EXPR = join(ROOT, "expressions");
const OUT = join(ROOT, "docs", "CATALOG.md");

const SECTIONS = [
  ["visualization", "Map styling"],
  ["labeling", "Labels"],
  ["popups", "Popups"],
  ["forms", "Field Maps and smart forms"],
  ["field-calculation", "Field calculation"],
  ["attribute-rules", "Attribute rules"],
  ["dashboards", "Dashboards"],
];

function parseHeader(src) {
  const lines = src.split("\n");
  const header = [];
  for (const line of lines) {
    if (!line.startsWith("//")) break;
    header.push(line.replace(/^\/\/ ?/, ""));
  }
  const meta = { title: header[0] ?? "", description: [] };
  for (const line of header.slice(1)) {
    const m = line.match(/^(Profile|Used in|Returns|Fields|Data): (.+)$/);
    if (m) meta[m[1]] = m[2];
    else if (line.trim()) meta.description.push(line.trim());
  }
  meta.description = meta.description.join(" ");
  return meta;
}

let md = "# Expression catalog\n\n";
md += "Generated from the header of each expression by `npm run catalog`. Do not edit by hand.\n";

for (const [folder, title] of SECTIONS) {
  const files = readdirSync(join(EXPR, folder)).filter((f) => f.endsWith(".arcade")).sort();
  md += `\n## ${title}\n`;
  for (const file of files) {
    const meta = parseHeader(readFileSync(join(EXPR, folder, file), "utf8"));
    md += `\n### [${meta.title}](../expressions/${folder}/${file})\n\n`;
    if (meta.description) md += `${meta.description}\n\n`;
    md += `| | |\n|---|---|\n`;
    for (const key of ["Profile", "Used in", "Returns", "Fields", "Data"]) {
      if (meta[key]) md += `| **${key}** | ${meta[key]} |\n`;
    }
  }
}

if (process.argv.includes("--check")) {
  const current = readFileSync(OUT, "utf8");
  if (current !== md) {
    console.error("docs/CATALOG.md is out of date. Run: npm run catalog");
    process.exit(1);
  }
  console.log("Catalog is up to date.");
} else {
  writeFileSync(OUT, md);
  console.log(`Wrote ${OUT}`);
}

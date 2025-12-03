#!/usr/bin/env node
import minimist from "minimist";
const args = minimist(process.argv.slice(2));

const DAY_MAP = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 0
};

function resolveAlias(str) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const map = {
    "today": 0,
    "tomorrow": 1,
    "yesterday": -1
  };

  if (str in map) {
    const d = new Date(today);
    d.setDate(d.getDate() + map[str]);
    return d;
  }

  const matchNext = str.match(/^next\s+(mon|tue|wed|thu|fri|sat|sun)$/);
  if (matchNext) {
    const target = DAY_MAP[matchNext[1]];
    const d = new Date(today);
    const diff = (target - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  return null;
}

function parseDate(dateStr) {
  const alias = resolveAlias(dateStr.toLowerCase());
  if (alias) return alias;

  const d = new Date(dateStr);
  if (isNaN(d)) throw new Error(`Invalid date: ${dateStr}`);
  return d;
}

function countDays(start, end, skipDaysSet) {
  if (end < start) throw new Error("End date cannot be before start date.");

  let current = new Date(start);
  let totalDays = 0;
  let includedDays = 0;
  let skippedDays = 0;

  while (current <= end) {
    totalDays++;

    if (skipDaysSet.has(current.getDay())) {
      skippedDays++;
    } else {
      includedDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return { totalDays, includedDays, skippedDays };
}

function parseRange(rangeStr) {
  const [from, to] = rangeStr.split(":");
  if (!from || !to) throw new Error("Range must be in from:to format.");
  return [parseDate(from), parseDate(to)];
}

// ---------------------------
// CLI Processing
// ---------------------------

if (!args.range && !args.r) {
  console.error("Use --range or -r with 'YYYY-MM-DD:YYYY-MM-DD'");
  process.exit(1);
}

const ranges = (args.range || args.r);
const skip = (args.skip || args.s || []).map(d => d.toLowerCase());
const skipSet = new Set(skip.map(d => DAY_MAP[d]));

let grandTotalDays = 0;
let grandIncluded = 0;
let grandSkipped = 0;

const parsedRanges = Array.isArray(ranges) ? ranges : [ranges];

parsedRanges.forEach((r) => {
  const [start, end] = parseRange(r);
  const { totalDays, includedDays, skippedDays } = countDays(start, end, skipSet);

  grandTotalDays += totalDays;
  grandIncluded += includedDays;
  grandSkipped += skippedDays;

  console.log(`Range ${r}:`);
  console.log(`  Total days: ${totalDays}`);
  console.log(`  Included days: ${includedDays}`);
  console.log(`  Skipped days: ${skippedDays}`);
  console.log("");
});

console.log("=== Final Sum ===");
console.log(`Total days: ${grandTotalDays}`);
console.log(`Total included days: ${grandIncluded}`);
console.log(`Total skipped days: ${grandSkipped}`);

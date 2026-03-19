import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Role } from "@/utils/types";

// ---------------------------------------------------------------------------
// Instructor whitelist
//
// Reads `whitelist.txt` (or the path in WHITELIST_PATH env var) to determine
// which UTORids are professors. One UTORid per line; comment lines start with #.
//
// Any UTORid in the file → PROFESSOR
// Any UTORid NOT in the file → STUDENT
//
// TAs are assigned per-course by professors via the UI and stored in
// CourseEnrollment.role. They are never listed here.
//
// File format (one entry per line):
//   utorid
//   # comment lines are ignored
//
// Example:
//   smithj
//   doejohn
// ---------------------------------------------------------------------------

function loadWhitelist(): Set<string> {
  const whitelistPath = resolve(process.env.WHITELIST_PATH ?? "./whitelist.txt");

  let contents: string;
  try {
    contents = readFileSync(whitelistPath, "utf-8");
  } catch {
    // If the file doesn't exist, everyone is a student — not a fatal error.
    console.warn(
      `[whitelist] Could not read whitelist at ${whitelistPath}. All users will be STUDENT.`
    );
    return new Set();
  }

  const set = new Set<string>();

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // Tolerate legacy "utorid,PROFESSOR" format — strip anything after a comma
    const utorid = line.split(",")[0].trim().toLowerCase();
    if (utorid) set.add(utorid);
  }

  return set;
}

// Loaded once at startup (module-level cache).
// Restart the server to pick up changes to whitelist.txt.
const WHITELIST: Set<string> = loadWhitelist();

/**
 * Returns PROFESSOR if the UTORid is in the whitelist, STUDENT otherwise.
 * TAs are never in the whitelist — they are managed per-course via the UI.
 */
export function getRoleFromWhitelist(utorid: string): Role {
  return WHITELIST.has(utorid.toLowerCase()) ? "PROFESSOR" : "STUDENT";
}

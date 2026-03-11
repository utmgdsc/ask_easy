import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Role } from "@/utils/types";

// ---------------------------------------------------------------------------
// Instructor whitelist
//
// Reads `whitelist.txt` (or the path in WHITELIST_PATH env var) to determine
// which UTORids should be assigned PROFESSOR or TA role on login.
// Any UTORid not in the file defaults to STUDENT.
//
// File format (one entry per line):
//   utorid,ROLE
//   # comment lines are ignored
//
// Example:
//   smithj,PROFESSOR
//   doejane,TA
// ---------------------------------------------------------------------------

type WhitelistRole = "PROFESSOR" | "TA";
type WhitelistMap = Map<string, WhitelistRole>;

const VALID_ROLES = new Set<string>(["PROFESSOR", "TA"]);

function loadWhitelist(): WhitelistMap {
  const whitelistPath = resolve(
    process.env.WHITELIST_PATH ?? "./whitelist.txt"
  );

  let contents: string;
  try {
    contents = readFileSync(whitelistPath, "utf-8");
  } catch {
    // If the file doesn't exist, everyone is a student — not a fatal error.
    console.warn(`[whitelist] Could not read whitelist at ${whitelistPath}. All users will be STUDENT.`);
    return new Map();
  }

  const map: WhitelistMap = new Map();

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const [utorid, role] = line.split(",").map((s) => s.trim());
    if (!utorid) continue;

    if (!role || !VALID_ROLES.has(role)) {
      console.warn(`[whitelist] Invalid or missing role for "${utorid}" (got "${role}"). Skipping.`);
      continue;
    }

    map.set(utorid.toLowerCase(), role as WhitelistRole);
  }

  return map;
}

// Loaded once at startup (module-level cache).
// Restart the server to pick up changes to whitelist.txt.
const WHITELIST: WhitelistMap = loadWhitelist();

/**
 * Returns the role for a given UTORid based on the whitelist.
 * Returns "STUDENT" for any UTORid not in the whitelist.
 */
export function getRoleFromWhitelist(utorid: string): Role {
  return WHITELIST.get(utorid.toLowerCase()) ?? "STUDENT";
}

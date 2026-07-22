import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export function openState(databasePath) {
  const resolved = path.resolve(databasePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const db = new DatabaseSync(resolved);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS scan_runs (
      id INTEGER PRIMARY KEY,
      run_key TEXT NOT NULL UNIQUE,
      target TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      complete INTEGER NOT NULL,
      source_files INTEGER NOT NULL,
      package_occurrences INTEGER NOT NULL,
      findings INTEGER NOT NULL,
      open_findings INTEGER NOT NULL,
      pending_findings INTEGER NOT NULL,
      closed_findings INTEGER NOT NULL,
      trust_json TEXT NOT NULL,
      result_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS detections (
      detection_key TEXT PRIMARY KEY,
      target TEXT NOT NULL,
      project TEXT NOT NULL,
      source TEXT NOT NULL,
      ecosystem TEXT NOT NULL,
      package TEXT NOT NULL,
      version TEXT NOT NULL,
      advisory TEXT NOT NULL,
      cve TEXT,
      severity TEXT NOT NULL,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      status TEXT NOT NULL,
      missing_scans INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS observations (
      run_id INTEGER NOT NULL REFERENCES scan_runs(id) ON DELETE CASCADE,
      detection_key TEXT NOT NULL REFERENCES detections(detection_key) ON DELETE CASCADE,
      observed_at TEXT NOT NULL,
      PRIMARY KEY (run_id, detection_key)
    );
    CREATE TABLE IF NOT EXISTS trust_assessments (
      id INTEGER PRIMARY KEY,
      run_id INTEGER NOT NULL REFERENCES scan_runs(id) ON DELETE CASCADE,
      coordinate TEXT NOT NULL,
      source TEXT NOT NULL,
      state TEXT NOT NULL,
      integrity_present INTEGER NOT NULL,
      registry_host TEXT,
      install_script INTEGER NOT NULL,
      provenance TEXT NOT NULL,
      reasons_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS trust_assessments_run_state ON trust_assessments(run_id, state);
    CREATE TABLE IF NOT EXISTS tool_verifications (
      id INTEGER PRIMARY KEY,
      created_at TEXT NOT NULL,
      file_path TEXT NOT NULL,
      repository TEXT NOT NULL,
      tag TEXT NOT NULL,
      asset_name TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      expected_sha256 TEXT,
      digest_match INTEGER NOT NULL,
      slsa_available INTEGER NOT NULL,
      slsa_verified INTEGER NOT NULL,
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS canaries (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      marker TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS canary_events (
      id INTEGER PRIMARY KEY,
      canary_id INTEGER NOT NULL REFERENCES canaries(id),
      occurred_at TEXT NOT NULL,
      remote_addr TEXT,
      user_agent TEXT,
      method TEXT NOT NULL,
      path TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY,
      occurred_at TEXT NOT NULL,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      subject TEXT NOT NULL,
      details_json TEXT NOT NULL
    );
  `);
  return { db, path: resolved };
}

export function recordAudit(db, eventType, severity, subject, details = {}) {
  db.prepare(`INSERT INTO audit_events (occurred_at, event_type, severity, subject, details_json)
    VALUES (?, ?, ?, ?, ?)`).run(new Date().toISOString(), eventType, severity, subject, JSON.stringify(details));
}

export function dashboardState(db) {
  const latestRun = db.prepare("SELECT * FROM scan_runs ORDER BY id DESC LIMIT 1").get() || null;
  const statusRows = db.prepare("SELECT status, COUNT(*) AS count FROM detections GROUP BY status ORDER BY status").all();
  const severityRows = db.prepare("SELECT severity, COUNT(*) AS count FROM detections WHERE status != 'closed_fixed' GROUP BY severity ORDER BY count DESC").all();
  const trustRows = latestRun ? db.prepare("SELECT state, COUNT(*) AS count FROM trust_assessments WHERE run_id = ? GROUP BY state ORDER BY count DESC").all(latestRun.id) : [];
  const recentRuns = db.prepare("SELECT id, target, completed_at, complete, findings, open_findings, pending_findings, closed_findings FROM scan_runs ORDER BY id DESC LIMIT 12").all();
  const detections = db.prepare("SELECT * FROM detections WHERE status != 'closed_fixed' ORDER BY CASE severity WHEN 'CRITICAL' THEN 5 WHEN 'HIGH' THEN 4 WHEN 'MODERATE' THEN 3 WHEN 'LOW' THEN 2 ELSE 1 END DESC, last_seen DESC LIMIT 200").all();
  const tools = db.prepare("SELECT * FROM tool_verifications ORDER BY id DESC LIMIT 20").all();
  const canaries = db.prepare("SELECT c.id, c.name, c.marker, c.created_at, c.status, COUNT(e.id) AS hits FROM canaries c LEFT JOIN canary_events e ON e.canary_id = c.id GROUP BY c.id ORDER BY c.id DESC").all();
  const canaryEvents = db.prepare("SELECT e.*, c.name, c.marker FROM canary_events e JOIN canaries c ON c.id = e.canary_id ORDER BY e.id DESC LIMIT 50").all();
  const auditEvents = db.prepare("SELECT * FROM audit_events ORDER BY id DESC LIMIT 50").all();
  return { latestRun, statusRows, severityRows, trustRows, recentRuns, detections, tools, canaries, canaryEvents, auditEvents };
}

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Mirroring the sandbox security rules from sqlController.ts
const FORBIDDEN_COMMANDS = [
  'DROP DATABASE',
  'DROP TABLE',
  'DROP SCHEMA',
  'TRUNCATE',
  'ALTER SYSTEM',
  'CREATE USER',
  'DROP USER',
  'GRANT ALL',
  'REVOKE ALL'
];

function isQueryAllowedInSandbox(query: string): { allowed: boolean; reason?: string } {
  const upper = query.trim().toUpperCase();

  for (const forbidden of FORBIDDEN_COMMANDS) {
    if (upper.includes(forbidden)) {
      return {
        allowed: false,
        reason: `Security Sandbox Violation: '${forbidden}' is blocked in the web console.`
      };
    }
  }

  return { allowed: true };
}

describe('SQL Console Sandbox Security Rules Unit Tests', () => {
  it('should allow benign SELECT queries', () => {
    const res = isQueryAllowedInSandbox('SELECT * FROM charging_station WHERE city = \'Bengaluru\';');
    assert.equal(res.allowed, true);
  });

  it('should allow CTE analytical queries', () => {
    const res = isQueryAllowedInSandbox('WITH RECURSIVE GridFeederHierarchy AS (SELECT * FROM charging_station) SELECT * FROM GridFeederHierarchy;');
    assert.equal(res.allowed, true);
  });

  it('should block DROP DATABASE attempts', () => {
    const res = isQueryAllowedInSandbox('DROP DATABASE voltgrid_db;');
    assert.equal(res.allowed, false);
    assert.match(res.reason!, /DROP DATABASE/);
  });

  it('should block DROP TABLE attempts (case-insensitive)', () => {
    const res = isQueryAllowedInSandbox('drop table charging_reservation CASCADE;');
    assert.equal(res.allowed, false);
    assert.match(res.reason!, /DROP TABLE/);
  });

  it('should block TRUNCATE statements', () => {
    const res = isQueryAllowedInSandbox('TRUNCATE TABLE user_account;');
    assert.equal(res.allowed, false);
    assert.match(res.reason!, /TRUNCATE/);
  });

  it('should block ALTER SYSTEM attempts', () => {
    const res = isQueryAllowedInSandbox('ALTER SYSTEM SET max_connections = 1000;');
    assert.equal(res.allowed, false);
    assert.match(res.reason!, /ALTER SYSTEM/);
  });

  it('should block privilege escalation commands', () => {
    const res = isQueryAllowedInSandbox('GRANT ALL PRIVILEGES ON DATABASE voltgrid_db TO public;');
    assert.equal(res.allowed, false);
    assert.match(res.reason!, /GRANT ALL/);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedSqlPath = path.resolve(__dirname, '../../database/05_seed_data.sql');
const seedSql = fs.readFileSync(seedSqlPath, 'utf8');

// Pure interval overlap checker matching PostgreSQL tstzrange && and BookingModal slot check
export function checkSlotOverlap(
  slotStartMs: number,
  slotEndMs: number,
  bookedSlots: Array<{ start_time: string; end_time: string }>
): boolean {
  return bookedSlots.some(b => {
    const bStart = new Date(b.start_time).getTime();
    const bEnd = new Date(b.end_time).getTime();
    return slotStartMs < bEnd && slotEndMs > bStart;
  });
}

describe('Seed Dataset Integrity & Slot Overlap Invariants', () => {
  it('should contain only valid 36-character hexadecimal UUID literals in 05_seed_data.sql', () => {
    const uuidCandidates = seedSql.match(/'[0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12}'/g) || [];
    assert.ok(uuidCandidates.length >= 60, `Expected at least 60 UUIDs in seed data, found ${uuidCandidates.length}`);

    const validHexUuidRegex = /^'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'$/i;
    for (const candidate of uuidCandidates) {
      assert.match(candidate, validHexUuidRegex, `Invalid hex UUID in seed data: ${candidate}`);
    }
  });

  it('should seed all 7 charging stations with physical charging bays (zero empty stations)', () => {
    const stationIds = [
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3',
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4',
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5',
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6',
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7',
    ];
    for (const stationId of stationIds) {
      const occurrences = seedSql.split(stationId).length - 1;
      // Each station appears at least once in charging_station INSERT and at least once in charging_bay INSERT
      assert.ok(occurrences >= 2, `Station ${stationId} must have at least one seeded charging bay`);
    }
  });

  it('should seed multiple tariff plans, drivers, vehicles, reservations, tickets, and telemetry alerts', () => {
    assert.match(seedSql, /Adani Total Energies Fleet Express/);
    assert.match(seedSql, /meera\.kulkarni@zoho\.in/);
    assert.match(seedSql, /kabir\.singh@evfleet\.in/);
    assert.match(seedSql, /Kia',\s*'EV6 GT-Line'/);
    assert.match(seedSql, /BYD',\s*'Atto 3 Extended'/);
    assert.match(seedSql, /OCPP_SURGE_ALERT/);
    assert.match(seedSql, /OCPP_THERMAL_ALERT/);
  });

  it('should accurately detect half-open time slot overlaps without false positives on adjacent boundaries', () => {
    const booked = [
      { start_time: '2026-10-12T10:00:00.000Z', end_time: '2026-10-12T12:00:00.000Z' }
    ];

    // Exact overlap (10:00 - 12:00)
    assert.equal(
      checkSlotOverlap(Date.parse('2026-10-12T10:00:00.000Z'), Date.parse('2026-10-12T12:00:00.000Z'), booked),
      true
    );

    // Partial overlap (11:00 - 13:00)
    assert.equal(
      checkSlotOverlap(Date.parse('2026-10-12T11:00:00.000Z'), Date.parse('2026-10-12T13:00:00.000Z'), booked),
      true
    );

    // Adjacent preceding slot (08:00 - 10:00) -> no overlap
    assert.equal(
      checkSlotOverlap(Date.parse('2026-10-12T08:00:00.000Z'), Date.parse('2026-10-12T10:00:00.000Z'), booked),
      false
    );

    // Adjacent succeeding slot (12:00 - 14:00) -> no overlap
    assert.equal(
      checkSlotOverlap(Date.parse('2026-10-12T12:00:00.000Z'), Date.parse('2026-10-12T14:00:00.000Z'), booked),
      false
    );
  });
});

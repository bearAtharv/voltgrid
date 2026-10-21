import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

export const formatSql = (sql: string): string => {
  if (!sql) return '';
  let trimmed = sql.trim();

  const existingLines = trimmed.split('\n');
  if (existingLines.length > 2) {
    const nonFirstLines = existingLines.slice(1).filter(l => l.trim().length > 0);
    if (nonFirstLines.length > 0) {
      const minIndent = nonFirstLines.reduce((min, line) => {
        const match = line.match(/^(\s+)\S/);
        return match ? Math.min(min, match[1].length) : min;
      }, Infinity);

      if (minIndent !== Infinity && minIndent > 0) {
        trimmed = existingLines[0] + '\n' + existingLines.slice(1).map(l => {
          return l.startsWith(' '.repeat(minIndent)) ? l.slice(minIndent) : l;
        }).join('\n');
      }
    }
    return trimmed;
  }

  // Single-pass regex with longest-to-shortest alternations to avoid double-replacement
  const clauseRegex = /\b(WITH RECURSIVE|WITH|SELECT DISTINCT|SELECT|FROM|LEFT OUTER JOIN|LEFT JOIN|RIGHT OUTER JOIN|RIGHT JOIN|INNER JOIN|FULL JOIN|CROSS JOIN|JOIN|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET|INSERT INTO|VALUES|UPDATE|SET|RETURNING|UNION ALL|UNION|CALL)\b/gi;
  const formatted = trimmed.replace(clauseRegex, '\n$1');

  const lines = formatted.split('\n').map(l => l.trim()).filter(Boolean);
  const indentedLines: string[] = [];

  const topLevelKeywords = [
    'WITH RECURSIVE', 'WITH', 'SELECT', 'FROM', 'LEFT', 'RIGHT', 'INNER', 'FULL', 'CROSS',
    'JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'RETURNING', 'UNION', 'CALL'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();
    const isTopLevel = topLevelKeywords.some(kw => upper.startsWith(kw));

    if (isTopLevel) {
      indentedLines.push(line);
    } else {
      indentedLines.push('  ' + line);
    }
  }

  return indentedLines.join('\n');
};

describe('SQL Formatter & Beautifier Engine Unit Tests', () => {
  it('should break flattened single-line queries into indented clauses', () => {
    const raw = 'SELECT bay_id, bay_number FROM charging_bay WHERE bay_status = \'AVAILABLE\' ORDER BY bay_number ASC;';
    const formatted = formatSql(raw);

    assert.ok(formatted.includes('SELECT'));
    assert.ok(formatted.includes('\nFROM'));
    assert.ok(formatted.includes('\nWHERE'));
    assert.ok(formatted.includes('\nORDER BY'));
  });

  it('should handle complex joins and grouping clauses in single pass', () => {
    const raw = 'SELECT cs.city, COUNT(cb.bay_id) FROM charging_station cs LEFT JOIN charging_bay cb ON cs.station_id = cb.station_id GROUP BY cs.city;';
    const formatted = formatSql(raw);

    assert.ok(formatted.includes('\nLEFT JOIN'));
    assert.ok(!formatted.includes('LEFT \nJOIN')); // No double-broken JOIN
    assert.ok(formatted.includes('\nGROUP BY'));
  });

  it('should handle stored procedure call queries', () => {
    const raw = 'CALL sp_book_charging_bay_atomic($1, $2, $3, $4, $5, $6, $7, $8);';
    const formatted = formatSql(raw);

    assert.ok(formatted.startsWith('CALL sp_book_charging_bay_atomic'));
  });
});

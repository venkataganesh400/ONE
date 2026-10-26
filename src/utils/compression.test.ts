import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compressData, decompressData, formatBytes, inspectEntitySizes } from './compression.ts';

test('compressData and decompressData correctly preserve typed objects and compute compression savings', () => {
  const sampleData = {
    user: 'student@campus.edu',
    tasks: Array.from({ length: 25 }, (_, i) => ({
      id: `task-${i}`,
      title: `Complete computer science problem set #${i} with detailed graph traversal benchmarks`,
      course: 'CS-301',
      completed: i % 2 === 0,
    })),
    expenses: Array.from({ length: 15 }, (_, i) => ({
      id: `exp-${i}`,
      title: `Campus mess dining weekly pass #${i}`,
      amount: 1250.5,
      category: 'Food & Dining',
      date: '2026-10-20',
    })),
  };

  const { compressed, metrics } = compressData(sampleData);

  assert.ok(compressed.length > 0, 'Compressed string should not be empty');
  assert.ok(metrics.originalBytes > metrics.compressedBytes, 'Compressed size should be smaller than raw JSON');
  assert.ok(metrics.ratioPercent > 0, 'Savings ratio should be positive');
  assert.ok(metrics.savedBytes > 0, 'Saved bytes should be positive');

  const decompressed = decompressData<typeof sampleData>(compressed);
  assert.deepEqual(decompressed, sampleData, 'Decompressed data must match original exactly');
});

test('formatBytes formats bytes correctly across units', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(2048), '2.0 KB');
  assert.equal(formatBytes(1048576 * 3.5), '3.50 MB');
});

test('inspectEntitySizes produces accurate individual breakdowns', () => {
  const breakdown = inspectEntitySizes({
    tasks: [{ id: '1', title: 'Task 1' }],
    expenses: [{ id: '1', title: 'Coffee', amount: 150 }],
  });

  assert.equal(breakdown.breakdown.length, 5);
  assert.ok(breakdown.totalRawBytes > 0);
});

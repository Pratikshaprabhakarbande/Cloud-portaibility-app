/**
 * Unit tests for the pure dashboard helper functions (no DB required).
 */
import {
  computeSuccessRate,
  computeProviderHealth,
  statusFromHealth,
  computeChangePct,
  aggregateUsageShare,
  reshapeDeploymentTrends,
  buildUtilizationSeries
} from '../../src/services/dashboard.helpers.js';

describe('computeSuccessRate', () => {
  it('returns null when there are no terminal deployments', () => {
    expect(computeSuccessRate({})).toBeNull();
    expect(computeSuccessRate({ pending: 3, in_progress: 2 })).toBeNull();
  });

  it('computes percentage over terminal outcomes only', () => {
    expect(computeSuccessRate({ success: 8, failed: 2 })).toBe(80);
    expect(computeSuccessRate({ success: 3, failed: 0, rolled_back: 1 })).toBe(75);
  });
});

describe('computeProviderHealth', () => {
  it('defaults to 90 when no metric is available', () => {
    expect(computeProviderHealth({})).toBe(90);
  });

  it('weights available metrics and renormalizes when some are missing', () => {
    // only successRate present -> equals successRate
    expect(computeProviderHealth({ successRate: 70 })).toBe(70);
    // all present: 0.4*100 + 0.3*80 + 0.3*60 = 40+24+18 = 82
    expect(computeProviderHealth({ successRate: 100, securityScore: 80, complianceScore: 60 })).toBe(82);
  });

  it('clamps to 0..100', () => {
    expect(computeProviderHealth({ successRate: 200 })).toBe(100);
  });
});

describe('statusFromHealth', () => {
  it('maps scores to coarse statuses', () => {
    expect(statusFromHealth(90)).toBe('operational');
    expect(statusFromHealth(75)).toBe('degraded');
    expect(statusFromHealth(50)).toBe('outage');
  });
});

describe('computeChangePct', () => {
  it('handles zero/empty previous safely', () => {
    expect(computeChangePct(100, 0)).toBe(0);
  });
  it('computes signed percentage change', () => {
    expect(computeChangePct(110, 100)).toBe(10);
    expect(computeChangePct(90, 100)).toBe(-10);
  });
});

describe('aggregateUsageShare', () => {
  it('returns percentage shares that reflect cost weights', () => {
    const shares = aggregateUsageShare({ aws: 50, azure: 30, gcp: 20 });
    const aws = shares.find((s) => s.name === 'AWS');
    expect(aws.value).toBe(50);
    expect(shares.reduce((s, x) => s + x.value, 0)).toBe(100);
  });

  it('handles all-zero costs without dividing by zero', () => {
    const shares = aggregateUsageShare({ aws: 0, azure: 0, gcp: 0 });
    expect(shares.every((s) => s.value === 0)).toBe(true);
  });
});

describe('reshapeDeploymentTrends', () => {
  const now = new Date('2026-06-16T00:00:00Z');

  it('zero-fills a continuous series of the requested length', () => {
    const series = reshapeDeploymentTrends([], 7, now);
    expect(series).toHaveLength(7);
    expect(series.every((d) => d.success === 0 && d.failed === 0)).toBe(true);
  });

  it('buckets success and failure (failed includes rolled_back)', () => {
    const today = now.toISOString().slice(0, 10);
    const rows = [
      { _id: { day: today, status: 'success' }, count: 4 },
      { _id: { day: today, status: 'failed' }, count: 1 },
      { _id: { day: today, status: 'rolled_back' }, count: 2 }
    ];
    const series = reshapeDeploymentTrends(rows, 7, now);
    const last = series[series.length - 1];
    expect(last.success).toBe(4);
    expect(last.failed).toBe(3);
  });
});

describe('buildUtilizationSeries', () => {
  it('returns 6 points with bounded percentages', () => {
    const series = buildUtilizationSeries(1);
    expect(series).toHaveLength(6);
    for (const p of series) {
      expect(p.cpu).toBeGreaterThanOrEqual(0);
      expect(p.cpu).toBeLessThanOrEqual(100);
      expect(p).toHaveProperty('memory');
      expect(p).toHaveProperty('network');
    }
  });

  it('scales up with a higher running ratio', () => {
    const low = buildUtilizationSeries(0);
    const high = buildUtilizationSeries(1);
    expect(high[3].cpu).toBeGreaterThan(low[3].cpu);
  });
});

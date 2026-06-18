/**
 * Pure helper functions for dashboard computations.
 *
 * Extracted from the service so the scoring/shaping logic can be unit-tested
 * without a database connection.
 */
import { DEPLOYMENT_STATUS, PROVIDERS } from '../config/constants.js';

export const PROVIDER_LABELS = {
  [PROVIDERS.AWS]: 'AWS',
  [PROVIDERS.AZURE]: 'Azure',
  [PROVIDERS.GCP]: 'GCP'
};

/** Default display region per provider (used when no resources are present). */
export const PROVIDER_DEFAULT_REGIONS = {
  [PROVIDERS.AWS]: 'us-east-1',
  [PROVIDERS.AZURE]: 'eastus',
  [PROVIDERS.GCP]: 'us-central1'
};

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
export const round = (n) => Math.round(n);

/**
 * Deployment success rate (0..100) from a status->count map.
 * Counts only terminal outcomes (success / failed / rolled_back).
 */
export function computeSuccessRate(statusCounts = {}) {
  const success = statusCounts[DEPLOYMENT_STATUS.SUCCESS] || 0;
  const failed = statusCounts[DEPLOYMENT_STATUS.FAILED] || 0;
  const rolledBack = statusCounts[DEPLOYMENT_STATUS.ROLLED_BACK] || 0;
  const terminal = success + failed + rolledBack;
  if (terminal === 0) return null; // no signal yet
  return round((success / terminal) * 100);
}

/**
 * Composite provider health score (0..100) from available metrics.
 * Weights: deployment success 40%, security 30%, compliance 30%.
 * Missing metrics are dropped and the remaining weights are renormalized.
 * Returns a sensible default (90) when no metric is available.
 */
export function computeProviderHealth({ successRate, securityScore, complianceScore } = {}) {
  const parts = [
    { value: successRate, weight: 0.4 },
    { value: securityScore, weight: 0.3 },
    { value: complianceScore, weight: 0.3 }
  ].filter((p) => typeof p.value === 'number' && !Number.isNaN(p.value));

  if (parts.length === 0) return 90;

  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  const weighted = parts.reduce((s, p) => s + p.value * p.weight, 0);
  return clamp(round(weighted / totalWeight));
}

/** Map a 0..100 health score to a coarse status. */
export function statusFromHealth(score) {
  if (score >= 85) return 'operational';
  if (score >= 70) return 'degraded';
  return 'outage';
}

/** Percentage change from previous to current (rounded to 1 decimal). */
export function computeChangePct(current, previous) {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Convert a per-provider cost map into share percentages for the usage chart. */
export function aggregateUsageShare(costByProvider = {}) {
  const entries = Object.entries(costByProvider).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) {
    return Object.keys(costByProvider).map((key) => ({ name: PROVIDER_LABELS[key] || key, value: 0 }));
  }
  return entries.map(([key, v]) => ({
    name: PROVIDER_LABELS[key] || key,
    value: round((v / total) * 100)
  }));
}

/**
 * Reshape raw `{ _id: { day, status }, count }` rows from the trends aggregate
 * into an ordered series of `{ date, success, failed }` covering the last N days
 * (zero-filled so the chart is continuous).
 */
export function reshapeDeploymentTrends(rows = [], days = 7, now = new Date()) {
  const byDay = new Map();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { date: key, success: 0, failed: 0 });
  }
  for (const row of rows) {
    const day = row?._id?.day;
    const status = row?._id?.status;
    const bucket = byDay.get(day);
    if (!bucket) continue;
    if (status === DEPLOYMENT_STATUS.SUCCESS) bucket.success += row.count;
    else if (status === DEPLOYMENT_STATUS.FAILED || status === DEPLOYMENT_STATUS.ROLLED_BACK) {
      bucket.failed += row.count;
    }
  }
  return Array.from(byDay.values());
}

/**
 * Build a modeled 24h resource-utilization series (CPU/Memory/Network %).
 *
 * Until Prometheus metrics land (Phase 11), utilization is *estimated* from the
 * current running-resource ratio using a deterministic diurnal curve — so it is
 * data-driven and stable rather than random.
 *
 * @param {number} runningRatio 0..1 (running resources / total resources)
 */
export function buildUtilizationSeries(runningRatio = 0.5) {
  const ratio = clamp(runningRatio, 0, 1);
  const load = 0.7 + 0.5 * ratio; // 0.7 .. 1.2
  // base diurnal factors at 4-hour intervals
  const points = [
    { time: '00:00', cpu: 0.32, mem: 0.46, net: 0.2 },
    { time: '04:00', cpu: 0.28, mem: 0.44, net: 0.18 },
    { time: '08:00', cpu: 0.62, mem: 0.58, net: 0.42 },
    { time: '12:00', cpu: 0.78, mem: 0.7, net: 0.55 },
    { time: '16:00', cpu: 0.71, mem: 0.67, net: 0.48 },
    { time: '20:00', cpu: 0.55, mem: 0.56, net: 0.35 }
  ];
  return points.map((p) => ({
    time: p.time,
    cpu: clamp(round(p.cpu * 100 * load)),
    memory: clamp(round(p.mem * 100 * load)),
    network: clamp(round(p.net * 100 * load))
  }));
}

/** Convert an aggregate array of `{ _id, count }` into a plain object map. */
export function rowsToMap(rows = [], key = '_id', val = 'count') {
  return rows.reduce((acc, r) => {
    acc[r[key]] = r[val];
    return acc;
  }, {});
}

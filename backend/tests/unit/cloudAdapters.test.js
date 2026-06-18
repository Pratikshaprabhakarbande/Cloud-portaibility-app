/**
 * Unit tests for the Cloud Adapter Layer that don't require a database:
 * TTL cache, MockProvider, ProviderFactory/registry, and MultiCloudProvider.
 */
process.env.NODE_ENV = 'test';

import { TTLCache } from '../../src/cloud-adapters/cache.js';
import MockProvider from '../../src/cloud-adapters/mock/MockProvider.js';
import MultiCloudProvider from '../../src/cloud-adapters/MultiCloudProvider.js';
import providerFactory from '../../src/cloud-adapters/ProviderFactory.js';
import AwsProvider from '../../src/cloud-adapters/aws/AwsProvider.js';

describe('TTLCache', () => {
  it('stores and retrieves values', () => {
    const c = new TTLCache(1000);
    c.set('a', 42);
    expect(c.get('a')).toBe(42);
    expect(c.get('missing')).toBeUndefined();
  });

  it('expires entries past their TTL', () => {
    const c = new TTLCache(1000);
    c.set('a', 1, -1); // already expired
    expect(c.get('a')).toBeUndefined();
  });

  it('invalidates by exact key and by prefix', () => {
    const c = new TTLCache(1000);
    c.set('aws:x', 1);
    c.set('aws:y', 2);
    c.set('gcp:z', 3);
    c.invalidate('aws:');
    expect(c.get('aws:x')).toBeUndefined();
    expect(c.get('aws:y')).toBeUndefined();
    expect(c.get('gcp:z')).toBe(3);
  });

  it('tracks hit/miss stats', () => {
    const c = new TTLCache(1000);
    c.set('a', 1);
    c.get('a');
    c.get('b');
    const s = c.stats();
    expect(s.hits).toBe(1);
    expect(s.misses).toBe(1);
  });
});

describe('MockProvider', () => {
  const mock = new MockProvider('aws');

  it('implements all six core methods with sane shapes', async () => {
    const resources = await mock.getResources();
    expect(resources.total).toBeGreaterThan(0);
    expect(resources).toHaveProperty('runningContainers');

    const deployments = await mock.getDeployments();
    expect(deployments.total).toBe(Object.values(deployments.byStatus).reduce((a, b) => a + b, 0));

    const cost = await mock.getCostSummary();
    expect(cost.trends).toHaveLength(6);

    const security = await mock.getSecurityFindings();
    expect(security.securityScore + security.riskScore).toBe(100);

    const compliance = await mock.getComplianceStatus();
    expect(compliance.overall).toBeGreaterThan(0);

    const health = await mock.getHealthScore();
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);
    expect(['operational', 'degraded', 'outage']).toContain(health.status);
  });
});

describe('ProviderFactory', () => {
  it('returns single-provider adapters for concrete scopes', () => {
    expect(providerFactory.get('aws')).toBeInstanceOf(AwsProvider);
    expect(providerFactory.resolveProviders('aws')).toHaveLength(1);
  });

  it('returns a composite for multi-cloud and resolves to all three providers', () => {
    expect(providerFactory.get('multi-cloud')).toBeInstanceOf(MultiCloudProvider);
    expect(providerFactory.resolveProviders('multi-cloud')).toHaveLength(3);
    expect(providerFactory.resolveProviders(undefined)).toHaveLength(3); // default
  });

  it('validates scopes and rejects unknown ones', () => {
    expect(providerFactory.isValidScope('gcp')).toBe(true);
    expect(providerFactory.isValidScope('multi-cloud')).toBe(true);
    expect(providerFactory.isValidScope('oracle')).toBe(false);
    expect(() => providerFactory.get('oracle')).toThrow();
  });
});

describe('MultiCloudProvider', () => {
  const multi = new MultiCloudProvider([
    new MockProvider('aws'),
    new MockProvider('azure'),
    new MockProvider('gcp')
  ]);

  it('aggregates deployment totals across providers', async () => {
    const [aws, azure, gcp, merged] = await Promise.all([
      new MockProvider('aws').getDeployments(),
      new MockProvider('azure').getDeployments(),
      new MockProvider('gcp').getDeployments(),
      multi.getDeployments()
    ]);
    expect(merged.total).toBe(aws.total + azure.total + gcp.total);
    expect(merged.provider).toBe('multi-cloud');
  });

  it('merges cost trends by month and reports per-provider breakdown', async () => {
    const cost = await multi.getCostSummary();
    expect(Array.isArray(cost.trends)).toBe(true);
    expect(cost.byProvider).toHaveProperty('aws');
  });

  it('returns a per-provider health breakdown', async () => {
    const health = await multi.getHealthScore();
    expect(health.providers).toHaveLength(3);
    expect(health.score).toBeGreaterThanOrEqual(0);
  });
});

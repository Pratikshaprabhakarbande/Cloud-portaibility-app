/**
 * GCP live SDK integration (Compute Engine / Cloud Storage / Monitoring / cost
 * estimation). Lazily imports @google-cloud/* clients; GcpProvider wraps each
 * call and falls back to demo data on any error. Excluded from coverage.
 *
 * Auth uses GOOGLE_APPLICATION_CREDENTIALS (service-account JSON) picked up by
 * the client libraries automatically.
 */

/** Compute Engine instances + Storage buckets -> resource inventory shape. */
export async function getResources(projectId) {
  const { InstancesClient } = await import('@google-cloud/compute');
  const { Storage } = await import('@google-cloud/storage');

  const instancesClient = new InstancesClient();
  const storage = new Storage({ projectId });

  const items = [];
  let running = 0;

  // Aggregated list returns instances across all zones.
  const iterable = instancesClient.aggregatedListAsync({ project: projectId });
  for await (const [, scopedList] of iterable) {
    for (const instance of scopedList.instances || []) {
      const status = instance.status === 'RUNNING' ? 'running' : instance.status === 'TERMINATED' ? 'stopped' : 'pending';
      if (status === 'running') running += 1;
      items.push({
        id: String(instance.id),
        resourceId: instance.name,
        name: instance.name,
        type: 'compute',
        service: 'ComputeEngine',
        status,
        region: (instance.zone || '').split('/').pop(),
        monthlyCost: 0,
        lockInRisk: 'low'
      });
    }
  }

  const [buckets] = await storage.getBuckets();
  for (const b of buckets || []) {
    items.push({
      id: b.id || b.name,
      resourceId: b.name,
      name: b.name,
      type: 'storage',
      service: 'CloudStorage',
      status: 'running',
      region: b.metadata?.location || 'global',
      monthlyCost: 0,
      lockInRisk: 'medium'
    });
  }

  const byType = {};
  const byStatus = {};
  for (const it of items) {
    byType[it.type] = (byType[it.type] || 0) + 1;
    byStatus[it.status] = (byStatus[it.status] || 0) + 1;
  }

  return {
    provider: 'gcp',
    total: items.length,
    running: running + (buckets?.length || 0),
    runningContainers: 0,
    byType,
    byStatus,
    items,
    source: 'gcp-sdk'
  };
}

/**
 * Cost estimation. Accurate GCP spend requires a BigQuery billing export;
 * lacking that, we provide a transparent ESTIMATE from running compute
 * instances (labeled as an estimate via the `source` field).
 */
export async function getCostSummary(projectId) {
  const { InstancesClient } = await import('@google-cloud/compute');
  const instancesClient = new InstancesClient();

  let runningInstances = 0;
  for await (const [, scopedList] of instancesClient.aggregatedListAsync({ project: projectId })) {
    for (const instance of scopedList.instances || []) {
      if (instance.status === 'RUNNING') runningInstances += 1;
    }
  }

  // Rough e2-small-equivalent estimate (~$25/instance/month) — for demonstration.
  const monthlyCost = runningInstances * 25;
  const month = new Date().toISOString().slice(0, 7);
  return {
    provider: 'gcp',
    currency: 'USD',
    dailyCost: Math.round(monthlyCost / 30),
    monthlyCost,
    projectedCost: Math.round(monthlyCost * 1.05),
    savings: 0,
    trends: [{ month, cost: monthlyCost }],
    source: 'gcp-estimate'
  };
}

/** Firewall rules allowing 0.0.0.0/0 ingress -> security findings. */
export async function getSecurityFindings(projectId) {
  const { FirewallsClient } = await import('@google-cloud/compute');
  const client = new FirewallsClient();

  const findings = [];
  for await (const fw of client.listAsync({ project: projectId })) {
    const open = (fw.sourceRanges || []).includes('0.0.0.0/0');
    const allows = (fw.allowed || []).length > 0;
    if (open && allows && fw.direction !== 'EGRESS' && !fw.disabled) {
      findings.push({
        title: `Firewall ${fw.name} allows 0.0.0.0/0 ingress`,
        category: 'security_group',
        severity: 'high',
        resourceId: fw.name,
        recommendation: 'Restrict sourceRanges to known CIDRs.'
      });
    }
  }

  const summary = { total: findings.length, critical: 0, high: findings.length, medium: 0, low: 0 };
  const securityScore = Math.max(0, 100 - findings.length * 10);
  return { provider: 'gcp', securityScore, riskScore: 100 - securityScore, summary, findings, source: 'gcp-sdk' };
}

export default { getResources, getCostSummary, getSecurityFindings };

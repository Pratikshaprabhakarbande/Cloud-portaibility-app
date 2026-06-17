/**
 * AWS live SDK integration (EC2 / S3 / CloudWatch / Cost Explorer).
 *
 * Every function lazily imports the relevant @aws-sdk client so the SDK is only
 * required when live mode is actually used. The AwsProvider calls these and
 * falls back to demo/DB data on any error. Returns shapes match the
 * CloudProvider contract used by the rest of the app.
 *
 * Not exercised by the offline/demo test suite (requires real credentials), so
 * this file is excluded from coverage in jest.config.js.
 */

/** EC2 instances + S3 buckets -> resource inventory shape. */
export async function getResources(region) {
  const { EC2Client, DescribeInstancesCommand } = await import('@aws-sdk/client-ec2');
  const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3');

  const ec2 = new EC2Client({ region });
  const s3 = new S3Client({ region });

  const [instances, buckets] = await Promise.all([
    ec2.send(new DescribeInstancesCommand({})),
    s3.send(new ListBucketsCommand({}))
  ]);

  const items = [];
  let running = 0;

  for (const reservation of instances.Reservations || []) {
    for (const i of reservation.Instances || []) {
      const state = i.State?.Name;
      const status = state === 'running' ? 'running' : state === 'stopped' ? 'stopped' : 'pending';
      if (status === 'running') running += 1;
      const nameTag = (i.Tags || []).find((t) => t.Key === 'Name')?.Value;
      items.push({
        id: i.InstanceId,
        resourceId: i.InstanceId,
        name: nameTag || i.InstanceId,
        type: 'compute',
        service: 'EC2',
        status,
        region,
        monthlyCost: 0,
        lockInRisk: 'low'
      });
    }
  }

  for (const b of buckets.Buckets || []) {
    items.push({
      id: b.Name,
      resourceId: b.Name,
      name: b.Name,
      type: 'storage',
      service: 'S3',
      status: 'running',
      region,
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
    provider: 'aws',
    total: items.length,
    running: running + (buckets.Buckets?.length || 0),
    runningContainers: 0,
    byType,
    byStatus,
    items,
    source: 'aws-sdk'
  };
}

/** Cost Explorer -> month-to-date cost summary. */
export async function getCostSummary() {
  const { CostExplorerClient, GetCostAndUsageCommand } = await import('@aws-sdk/client-cost-explorer');
  // Cost Explorer is a global service; us-east-1 is the standard endpoint.
  const ce = new CostExplorerClient({ region: 'us-east-1' });

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), 1);
  const fmt = (d) => d.toISOString().slice(0, 10);

  const res = await ce.send(
    new GetCostAndUsageCommand({
      TimePeriod: { Start: fmt(start), End: fmt(end) },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost']
    })
  );

  const amount = parseFloat(res.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount || '0');
  const monthlyCost = Math.round(amount);
  return {
    provider: 'aws',
    currency: res.ResultsByTime?.[0]?.Total?.UnblendedCost?.Unit || 'USD',
    dailyCost: Math.round(monthlyCost / 30),
    monthlyCost,
    projectedCost: Math.round(monthlyCost * 1.05),
    savings: 0,
    trends: [{ month: fmt(start).slice(0, 7), cost: monthlyCost }],
    source: 'aws-sdk'
  };
}

/** Basic security findings from EC2 security groups (open ingress). */
export async function getSecurityFindings(region) {
  const { EC2Client, DescribeSecurityGroupsCommand } = await import('@aws-sdk/client-ec2');
  const ec2 = new EC2Client({ region });

  const findings = [];
  const sgs = await ec2.send(new DescribeSecurityGroupsCommand({}));
  for (const sg of sgs.SecurityGroups || []) {
    for (const perm of sg.IpPermissions || []) {
      const openV4 = (perm.IpRanges || []).some((r) => r.CidrIp === '0.0.0.0/0');
      const openV6 = (perm.Ipv6Ranges || []).some((r) => r.CidrIpv6 === '::/0');
      if (openV4 || openV6) {
        findings.push({
          title: `Security group ${sg.GroupId} allows unrestricted ingress on port ${perm.FromPort ?? 'all'}`,
          category: 'security_group',
          severity: 'high',
          resourceId: sg.GroupId,
          recommendation: 'Restrict inbound rules to known CIDR ranges.'
        });
      }
    }
  }

  const summary = {
    total: findings.length,
    critical: 0,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: 0,
    low: 0
  };
  const securityScore = Math.max(0, 100 - findings.length * 10);
  return {
    provider: 'aws',
    securityScore,
    riskScore: 100 - securityScore,
    summary,
    findings,
    source: 'aws-sdk'
  };
}

/** CloudWatch -> recent average CPU utilization across the account (modeled series). */
export async function getMonitoring(region) {
  const { CloudWatchClient, GetMetricStatisticsCommand } = await import('@aws-sdk/client-cloudwatch');
  const cw = new CloudWatchClient({ region });

  const end = new Date();
  const start = new Date(end.getTime() - 6 * 60 * 60 * 1000); // last 6h
  const res = await cw.send(
    new GetMetricStatisticsCommand({
      Namespace: 'AWS/EC2',
      MetricName: 'CPUUtilization',
      StartTime: start,
      EndTime: end,
      Period: 3600,
      Statistics: ['Average']
    })
  );

  const points = (res.Datapoints || [])
    .sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp))
    .map((d) => ({
      time: new Date(d.Timestamp).toISOString().slice(11, 16),
      cpu: Math.round(d.Average || 0),
      memory: 0,
      network: 0
    }));

  return { provider: 'aws', source: 'cloudwatch', series: points };
}

export default { getResources, getCostSummary, getSecurityFindings, getMonitoring };

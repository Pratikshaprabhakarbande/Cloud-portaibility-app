/**
 * Azure live SDK integration (Resource Groups / VMs / Monitor / Consumption).
 *
 * Lazily imports @azure/* clients so they're only required in live mode. The
 * AzureProvider calls these and falls back to demo/DB data on any error.
 * Excluded from coverage (requires real credentials).
 */
function credential() {
  // Imported lazily by callers; kept as a helper to build a ClientSecretCredential.
  return import('@azure/identity').then(({ ClientSecretCredential }) =>
    new ClientSecretCredential(
      process.env.AZURE_TENANT_ID,
      process.env.AZURE_CLIENT_ID,
      process.env.AZURE_CLIENT_SECRET
    )
  );
}

/** Resource groups + VMs -> resource inventory shape. */
export async function getResources() {
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
  const cred = await credential();
  const { ResourceManagementClient } = await import('@azure/arm-resources');
  const { ComputeManagementClient } = await import('@azure/arm-compute');

  const rmc = new ResourceManagementClient(cred, subscriptionId);
  const cmc = new ComputeManagementClient(cred, subscriptionId);

  const items = [];
  let running = 0;

  for await (const group of rmc.resourceGroups.list()) {
    items.push({
      id: group.id,
      resourceId: group.name,
      name: group.name,
      type: 'network',
      service: 'ResourceGroup',
      status: 'running',
      region: group.location,
      monthlyCost: 0,
      lockInRisk: 'low'
    });
  }

  for await (const vm of cmc.virtualMachines.listAll()) {
    items.push({
      id: vm.id,
      resourceId: vm.name,
      name: vm.name,
      type: 'compute',
      service: 'VirtualMachine',
      status: 'running',
      region: vm.location,
      monthlyCost: 0,
      lockInRisk: 'medium'
    });
    running += 1;
  }

  const byType = {};
  const byStatus = {};
  for (const it of items) {
    byType[it.type] = (byType[it.type] || 0) + 1;
    byStatus[it.status] = (byStatus[it.status] || 0) + 1;
  }

  return {
    provider: 'azure',
    total: items.length,
    running,
    runningContainers: 0,
    byType,
    byStatus,
    items,
    source: 'azure-sdk'
  };
}

/** Consumption (usage details) -> month-to-date cost summary. */
export async function getCostSummary() {
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
  const cred = await credential();
  const { ConsumptionManagementClient } = await import('@azure/arm-consumption');
  const client = new ConsumptionManagementClient(cred, subscriptionId);

  const scope = `/subscriptions/${subscriptionId}`;
  let monthlyCost = 0;
  for await (const item of client.usageDetails.list(scope)) {
    monthlyCost += Number(item.cost || item.pretaxCost || 0);
  }
  monthlyCost = Math.round(monthlyCost);
  const month = new Date().toISOString().slice(0, 7);
  return {
    provider: 'azure',
    currency: 'USD',
    dailyCost: Math.round(monthlyCost / 30),
    monthlyCost,
    projectedCost: Math.round(monthlyCost * 1.05),
    savings: 0,
    trends: [{ month, cost: monthlyCost }],
    source: 'azure-sdk'
  };
}

/** Network security groups with permissive rules -> security findings. */
export async function getSecurityFindings() {
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
  const cred = await credential();
  const { NetworkManagementClient } = await import('@azure/arm-network');
  const client = new NetworkManagementClient(cred, subscriptionId);

  const findings = [];
  for await (const nsg of client.networkSecurityGroups.listAll()) {
    for (const rule of nsg.securityRules || []) {
      const open = rule.access === 'Allow' && rule.direction === 'Inbound' &&
        (rule.sourceAddressPrefix === '*' || rule.sourceAddressPrefix === '0.0.0.0/0' || rule.sourceAddressPrefix === 'Internet');
      if (open) {
        findings.push({
          title: `NSG ${nsg.name} allows inbound from ${rule.sourceAddressPrefix} on ${rule.destinationPortRange}`,
          category: 'security_group',
          severity: 'high',
          resourceId: nsg.name,
          recommendation: 'Restrict the NSG source to known address prefixes.'
        });
      }
    }
  }

  const summary = { total: findings.length, critical: 0, high: findings.length, medium: 0, low: 0 };
  const securityScore = Math.max(0, 100 - findings.length * 10);
  return { provider: 'azure', securityScore, riskScore: 100 - securityScore, summary, findings, source: 'azure-sdk' };
}

export default { getResources, getCostSummary, getSecurityFindings };

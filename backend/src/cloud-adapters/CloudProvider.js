/**
 * CloudProvider — abstract base defining the provider adapter contract.
 *
 * Every adapter (AWS, Azure, GCP, Mock, Multi-Cloud) implements this interface
 * so the rest of the app stays cloud-agnostic. Concrete adapters override the
 * six core methods. Calling a method that isn't overridden throws, surfacing
 * incomplete implementations early.
 *
 * Method contracts (provider-scoped unless the adapter is composite):
 *   getResources()         -> { provider, total, running, byType, byStatus, items }
 *   getDeployments()       -> { provider, total, active, byStatus, byProvider, recent }
 *   getCostSummary()       -> { provider, currency, dailyCost, monthlyCost, projectedCost, savings, trends }
 *   getSecurityFindings()  -> { provider, securityScore, riskScore, summary, findings }
 *   getComplianceStatus()  -> { provider, overall, reports }
 *   getHealthScore()       -> { provider, score, status, metrics }
 */
export default class CloudProvider {
  /**
   * @param {object} opts
   * @param {string} opts.provider provider key (aws|azure|gcp|mock|multi-cloud)
   * @param {string} [opts.mode='demo'] 'demo' (DB/mock) | 'live' (real SDK)
   */
  constructor({ provider, mode = 'demo' } = {}) {
    if (!provider) throw new Error('CloudProvider requires a provider key');
    this.provider = provider;
    this.mode = mode;
  }

  // eslint-disable-next-line class-methods-use-this
  _notImplemented(method) {
    throw new Error(`${method}() not implemented for provider "${this.provider}"`);
  }

  getResources() {
    return this._notImplemented('getResources');
  }

  getDeployments() {
    return this._notImplemented('getDeployments');
  }

  getCostSummary() {
    return this._notImplemented('getCostSummary');
  }

  getSecurityFindings() {
    return this._notImplemented('getSecurityFindings');
  }

  getComplianceStatus() {
    return this._notImplemented('getComplianceStatus');
  }

  getHealthScore() {
    return this._notImplemented('getHealthScore');
  }

  /** Descriptive metadata for the registry / diagnostics. */
  describe() {
    return { provider: this.provider, mode: this.mode };
  }
}

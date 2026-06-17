/**
 * AzureProvider — Azure adapter.
 * Demo/DB-backed by default; delegates to the live Azure SDK (`azureLive.js`)
 * when DEMO_MODE=false and Azure credentials are present, with graceful
 * fallback to demo data on any error.
 */
import DbCloudProvider from '../DbCloudProvider.js';
import { PROVIDERS } from '../../config/constants.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

export default class AzureProvider extends DbCloudProvider {
  constructor() {
    const live = !env.demoMode && env.cloud.azure.hasCredentials;
    super({ provider: PROVIDERS.AZURE, mode: live ? 'live' : 'demo' });
    this.live = live;
  }

  // eslint-disable-next-line class-methods-use-this
  async _live() {
    return import('./azureLive.js');
  }

  async getResources() {
    if (!this.live) return super.getResources();
    try {
      return await (await this._live()).getResources();
    } catch (err) {
      logger.warn(`[azure] live getResources failed, falling back to demo: ${err.message}`);
      return super.getResources();
    }
  }

  async getCostSummary() {
    if (!this.live) return super.getCostSummary();
    try {
      return await (await this._live()).getCostSummary();
    } catch (err) {
      logger.warn(`[azure] live getCostSummary failed, falling back to demo: ${err.message}`);
      return super.getCostSummary();
    }
  }

  async getSecurityFindings() {
    if (!this.live) return super.getSecurityFindings();
    try {
      return await (await this._live()).getSecurityFindings();
    } catch (err) {
      logger.warn(`[azure] live getSecurityFindings failed, falling back to demo: ${err.message}`);
      return super.getSecurityFindings();
    }
  }

  describe() {
    return { ...super.describe(), hasCredentials: env.cloud.azure.hasCredentials, live: this.live };
  }
}

/**
 * GcpProvider — Google Cloud adapter.
 * Demo/DB-backed by default; delegates to the live GCP SDK (`gcpLive.js`) when
 * DEMO_MODE=false and GCP credentials are present, with graceful fallback.
 */
import DbCloudProvider from '../DbCloudProvider.js';
import { PROVIDERS } from '../../config/constants.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

export default class GcpProvider extends DbCloudProvider {
  constructor() {
    const live = !env.demoMode && env.cloud.gcp.hasCredentials;
    super({ provider: PROVIDERS.GCP, mode: live ? 'live' : 'demo' });
    this.projectId = env.cloud.gcp.projectId;
    this.live = live;
  }

  // eslint-disable-next-line class-methods-use-this
  async _live() {
    return import('./gcpLive.js');
  }

  async getResources() {
    if (!this.live) return super.getResources();
    try {
      return await (await this._live()).getResources(this.projectId);
    } catch (err) {
      logger.warn(`[gcp] live getResources failed, falling back to demo: ${err.message}`);
      return super.getResources();
    }
  }

  async getCostSummary() {
    if (!this.live) return super.getCostSummary();
    try {
      return await (await this._live()).getCostSummary(this.projectId);
    } catch (err) {
      logger.warn(`[gcp] live getCostSummary failed, falling back to demo: ${err.message}`);
      return super.getCostSummary();
    }
  }

  async getSecurityFindings() {
    if (!this.live) return super.getSecurityFindings();
    try {
      return await (await this._live()).getSecurityFindings(this.projectId);
    } catch (err) {
      logger.warn(`[gcp] live getSecurityFindings failed, falling back to demo: ${err.message}`);
      return super.getSecurityFindings();
    }
  }

  describe() {
    return { ...super.describe(), projectId: this.projectId, hasCredentials: env.cloud.gcp.hasCredentials, live: this.live };
  }
}

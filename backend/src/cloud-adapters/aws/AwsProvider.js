/**
 * AwsProvider — AWS adapter.
 *
 * Serves AWS-scoped data from the database by default (demo mode). When
 * DEMO_MODE=false AND AWS credentials are present, resource/cost/security calls
 * delegate to the live AWS SDK integration (`awsLive.js`), loaded lazily. Any
 * live error falls back to the DB-backed implementation, so the app never
 * crashes and stays usable without cloud access.
 */
import DbCloudProvider from '../DbCloudProvider.js';
import { PROVIDERS } from '../../config/constants.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

export default class AwsProvider extends DbCloudProvider {
  constructor() {
    const live = !env.demoMode && env.cloud.aws.hasCredentials;
    super({ provider: PROVIDERS.AWS, mode: live ? 'live' : 'demo' });
    this.region = env.cloud.aws.region;
    this.live = live;
  }

  /** Lazily load the live SDK module only when needed. */
  // eslint-disable-next-line class-methods-use-this
  async _live() {
    return import('./awsLive.js');
  }

  async getResources() {
    if (!this.live) return super.getResources();
    try {
      const live = await this._live();
      return await live.getResources(this.region);
    } catch (err) {
      logger.warn(`[aws] live getResources failed, falling back to demo: ${err.message}`);
      return super.getResources();
    }
  }

  async getCostSummary() {
    if (!this.live) return super.getCostSummary();
    try {
      const live = await this._live();
      return await live.getCostSummary();
    } catch (err) {
      logger.warn(`[aws] live getCostSummary failed, falling back to demo: ${err.message}`);
      return super.getCostSummary();
    }
  }

  async getSecurityFindings() {
    if (!this.live) return super.getSecurityFindings();
    try {
      const live = await this._live();
      return await live.getSecurityFindings(this.region);
    } catch (err) {
      logger.warn(`[aws] live getSecurityFindings failed, falling back to demo: ${err.message}`);
      return super.getSecurityFindings();
    }
  }

  /** CloudWatch-backed monitoring series (null when not live). */
  async getMonitoring() {
    if (!this.live) return null;
    try {
      const live = await this._live();
      return await live.getMonitoring(this.region);
    } catch (err) {
      logger.warn(`[aws] live getMonitoring failed: ${err.message}`);
      return null;
    }
  }

  describe() {
    return { ...super.describe(), region: this.region, hasCredentials: env.cloud.aws.hasCredentials, live: this.live };
  }
}

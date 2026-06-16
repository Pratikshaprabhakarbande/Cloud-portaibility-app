/**
 * GcpProvider — GCP adapter (DB-backed demo mode for now).
 * Live GCP SDK integration follows the AWS implementation.
 */
import DbCloudProvider from '../DbCloudProvider.js';
import { PROVIDERS } from '../../config/constants.js';

export default class GcpProvider extends DbCloudProvider {
  constructor() {
    const hasCredentials = Boolean(process.env.GCP_PROJECT_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS);
    super({ provider: PROVIDERS.GCP, mode: 'demo' });
    this.hasCredentials = hasCredentials;
  }

  describe() {
    return { ...super.describe(), hasCredentials: this.hasCredentials };
  }
}

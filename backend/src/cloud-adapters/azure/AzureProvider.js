/**
 * AzureProvider — Azure adapter (DB-backed demo mode for now).
 * Live Azure SDK integration follows the AWS implementation.
 */
import DbCloudProvider from '../DbCloudProvider.js';
import { PROVIDERS } from '../../config/constants.js';

export default class AzureProvider extends DbCloudProvider {
  constructor() {
    const hasCredentials = Boolean(
      process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_TENANT_ID
    );
    super({ provider: PROVIDERS.AZURE, mode: 'demo' });
    this.hasCredentials = hasCredentials;
  }

  describe() {
    return { ...super.describe(), hasCredentials: this.hasCredentials };
  }
}

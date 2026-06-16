/**
 * AwsProvider — AWS adapter.
 *
 * Currently serves AWS-scoped data from the database (demo mode). The real AWS
 * SDK integration (EC2/S3/Cost Explorer/Security Hub) is the next module and
 * will override these methods to call live APIs when credentials are present,
 * gracefully falling back to the DB-backed implementation otherwise.
 */
import DbCloudProvider from '../DbCloudProvider.js';
import { PROVIDERS } from '../../config/constants.js';
import env from '../../config/env.js';

export default class AwsProvider extends DbCloudProvider {
  constructor() {
    const hasCredentials = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    // Live mode is reserved for the upcoming SDK integration.
    super({ provider: PROVIDERS.AWS, mode: 'demo' });
    this.hasCredentials = hasCredentials;
    this.region = env.aws?.region || process.env.AWS_REGION || 'us-east-1';
  }

  describe() {
    return { ...super.describe(), region: this.region, hasCredentials: this.hasCredentials };
  }
}

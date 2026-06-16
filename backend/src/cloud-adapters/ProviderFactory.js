/**
 * ProviderFactory & registry.
 *
 * Maintains singleton adapter instances and resolves a provider "scope" to an
 * adapter. Supported scopes:
 *   - 'aws' | 'azure' | 'gcp'  -> the matching single-provider adapter
 *   - 'mock'                   -> the synthetic MockProvider
 *   - 'multi-cloud' (aliases: 'multi', 'all', '') -> MultiCloudProvider
 *
 * In Demo Mode (or when a provider has no credentials) the AWS/Azure/GCP
 * adapters serve database-backed data; the registry can also force the mock
 * adapter via DEMO_MOCK.
 */
import AwsProvider from './aws/AwsProvider.js';
import AzureProvider from './azure/AzureProvider.js';
import GcpProvider from './gcp/GcpProvider.js';
import MockProvider from './mock/MockProvider.js';
import MultiCloudProvider from './MultiCloudProvider.js';
import { PROVIDERS } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import { adapterCache } from './cache.js';

export const MULTI_CLOUD = 'multi-cloud';
export const SCOPES = [PROVIDERS.AWS, PROVIDERS.AZURE, PROVIDERS.GCP, MULTI_CLOUD];
const MULTI_ALIASES = new Set([MULTI_CLOUD, 'multi', 'all', '', undefined, null]);

class ProviderFactory {
  constructor() {
    this._registry = null;
  }

  /** Lazily build singleton single-provider adapters. */
  registry() {
    if (!this._registry) {
      this._registry = {
        [PROVIDERS.AWS]: new AwsProvider(),
        [PROVIDERS.AZURE]: new AzureProvider(),
        [PROVIDERS.GCP]: new GcpProvider(),
        mock: new MockProvider('mock')
      };
    }
    return this._registry;
  }

  /** The three real single-provider adapters (used by multi-cloud + dashboard). */
  singleProviders() {
    const reg = this.registry();
    return [reg[PROVIDERS.AWS], reg[PROVIDERS.AZURE], reg[PROVIDERS.GCP]];
  }

  /**
   * Resolve a scope to a list of single-provider adapters (for iteration).
   * @param {string} [scope]
   * @returns {CloudProvider[]}
   */
  resolveProviders(scope) {
    const reg = this.registry();
    if (MULTI_ALIASES.has(scope)) return this.singleProviders();
    if (scope === 'mock') return [reg.mock];
    const adapter = reg[scope];
    if (!adapter) throw ApiError.badRequest(`Unknown provider scope: ${scope}`);
    return [adapter];
  }

  /**
   * Get a single adapter for a scope. Multi-cloud returns a composite adapter.
   * @param {string} [scope]
   * @returns {CloudProvider}
   */
  get(scope) {
    if (MULTI_ALIASES.has(scope)) return new MultiCloudProvider(this.singleProviders());
    const reg = this.registry();
    const adapter = reg[scope];
    if (!adapter) throw ApiError.badRequest(`Unknown provider scope: ${scope}`);
    return adapter;
  }

  /** Validate a scope string. */
  isValidScope(scope) {
    return MULTI_ALIASES.has(scope) || scope === 'mock' || Boolean(this.registry()[scope]);
  }

  /** Diagnostics: describe all registered adapters + cache stats. */
  describe() {
    const reg = this.registry();
    return {
      scopes: SCOPES,
      adapters: Object.values(reg).map((a) => a.describe()),
      cache: adapterCache.stats()
    };
  }

  /** Reset registry + cache (used in tests). */
  reset() {
    this._registry = null;
    adapterCache.clear();
  }
}

// Export a singleton factory.
const providerFactory = new ProviderFactory();
export default providerFactory;

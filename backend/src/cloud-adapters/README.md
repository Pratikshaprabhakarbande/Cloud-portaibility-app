# cloud-adapters/

Implements the **Cloud Provider Adapter** pattern — the core abstraction that
keeps every module cloud-agnostic.

```
cloud-adapters/
├── CloudProvider.js   # abstract interface / base class
├── index.js           # ProviderFactory: returns adapter by provider + mode
├── aws/               # AWS adapter (implemented first, Phase 5/8)
├── azure/             # Azure adapter
├── gcp/               # GCP adapter
└── mock/              # Demo Mode adapter (always available, zero cost)
```

Interface methods: `getStatus`, `listDeployments`, `listContainers`,
`scanSecurity`, `getCostReport`, `generateTerraform`, `applyTerraform`,
`destroyTerraform`, `listKubernetes`, `getMonitoringMetrics`, `getCarbonEstimate`.

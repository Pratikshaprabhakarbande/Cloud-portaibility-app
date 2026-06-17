/**
 * AI advisor extension hooks.
 *
 * Lets future/custom advisor engines (e.g. an LLM-backed engine) be registered
 * by name and selected via AI_PROVIDER, without modifying core code:
 *
 *   import { registerAdvisor } from './hooks.js';
 *   registerAdvisor('my-llm', () => new MyLlmAdvisor());
 *   // then set AI_PROVIDER=my-llm
 */
const registry = new Map();

export function registerAdvisor(name, factory) {
  if (typeof factory !== 'function') throw new Error('advisor factory must be a function');
  registry.set(name, factory);
}

export function getRegisteredAdvisor(name) {
  const factory = registry.get(name);
  return factory ? factory() : null;
}

export function listAdvisors() {
  return [...registry.keys()];
}

export default { registerAdvisor, getRegisteredAdvisor, listAdvisors };

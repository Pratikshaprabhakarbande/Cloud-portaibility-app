/**
 * Terraform automation service.
 *
 * SAFETY MODEL (cloud/SRE best practice):
 *   - DEFAULT = simulation. With `TERRAFORM_ENABLED=false` (the default), every
 *     command is simulated deterministically — no terraform binary is invoked,
 *     no cloud APIs are called, and no billable resources can be created. This
 *     keeps the platform zero-cost, offline-friendly, and safe for demos/CI.
 *   - Real execution is opt-in: set `TERRAFORM_ENABLED=true`. Even then,
 *     mutating actions (apply/destroy) additionally require
 *     `TERRAFORM_ALLOW_MUTATIONS=true`.
 *
 * Every command is recorded in deployment history (the existing Deployment
 * model, type='terraform') with provider, status, logs, and timestamps.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';
import deploymentRepository from '../repositories/DeploymentRepository.js';
import { PROVIDER_VALUES, DEPLOYMENT_TYPES, DEPLOYMENT_STATUS } from '../config/constants.js';

export const TF_ACTIONS = Object.freeze(['init', 'validate', 'plan', 'apply', 'destroy']);
const MUTATING = new Set(['apply', 'destroy']);

/** Map a terraform action to a deployment status. */
function statusForAction(action, ok) {
  if (!ok) return DEPLOYMENT_STATUS.FAILED;
  if (action === 'destroy') return DEPLOYMENT_STATUS.DESTROYED;
  if (action === 'apply') return DEPLOYMENT_STATUS.SUCCESS;
  return DEPLOYMENT_STATUS.SUCCESS;
}

/** Deterministic, realistic simulated CLI output (no side effects). */
function simulate(provider, action) {
  const header = `Terraform (simulated) — provider=${provider} action=${action}`;
  const lines = {
    init: ['Initializing provider plugins...', `- Using hashicorp/${provider} (cached)`, 'Terraform has been successfully initialized!'],
    validate: ['Success! The configuration is valid.'],
    plan: [
      'Refreshing state... (simulated)',
      'Note: enable_compute=false — no billable resources in this plan.',
      'Plan: 0 to add, 0 to change, 0 to destroy.'
    ],
    apply: [
      'Note: enable_compute=false — nothing to create.',
      'Apply complete! Resources: 0 added, 0 changed, 0 destroyed.'
    ],
    destroy: ['Destroy complete! Resources: 0 destroyed.']
  }[action] || ['(no output)'];
  return [header, ...lines].join('\n');
}

/** Run the real terraform CLI in the provider directory. */
function execTerraform(provider, action) {
  return new Promise((resolve) => {
    const cwd = path.resolve(process.cwd(), env.terraform.rootDir, provider);
    // Non-interactive, no color; plan/apply/destroy auto-approve where needed.
    const argsByAction = {
      init: ['init', '-input=false', '-no-color'],
      validate: ['validate', '-no-color'],
      plan: ['plan', '-input=false', '-no-color'],
      apply: ['apply', '-input=false', '-no-color', '-auto-approve'],
      destroy: ['destroy', '-input=false', '-no-color', '-auto-approve']
    };
    const child = spawn(env.terraform.bin, argsByAction[action], { cwd });
    let out = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (out += d.toString()));
    child.on('error', (err) => resolve({ ok: false, output: `Failed to start terraform: ${err.message}` }));
    child.on('close', (code) => resolve({ ok: code === 0, output: out.trim() || `(exit ${code})` }));
  });
}

/**
 * Run a terraform action for a provider and record it in deployment history.
 * @param {string} provider aws|azure|gcp
 * @param {string} action init|validate|plan|apply|destroy
 * @param {object} user authenticated user (req.user)
 * @returns {Promise<object>} the persisted deployment record (as JSON)
 */
export async function runTerraform(provider, action, user) {
  if (!PROVIDER_VALUES.includes(provider)) {
    throw ApiError.badRequest(`Invalid provider: ${provider}`);
  }
  if (!TF_ACTIONS.includes(action)) {
    throw ApiError.badRequest(`Invalid terraform action: ${action}`);
  }
  if (MUTATING.has(action) && env.terraform.enabled && !env.terraform.allowMutations) {
    throw ApiError.forbidden(
      `Terraform '${action}' is disabled. Set TERRAFORM_ALLOW_MUTATIONS=true to permit it.`
    );
  }

  const startedAt = new Date();
  let result;
  let mode;
  if (env.terraform.enabled) {
    mode = 'live';
    result = await execTerraform(provider, action);
  } else {
    mode = 'simulated';
    result = { ok: true, output: simulate(provider, action) };
  }
  const finishedAt = new Date();
  const durationMs = finishedAt - startedAt;

  logger.info(`[terraform] ${mode} ${provider} ${action} -> ${result.ok ? 'ok' : 'failed'}`);

  const record = await deploymentRepository.create(
    {
      name: `terraform-${provider}-${action}`,
      provider,
      type: DEPLOYMENT_TYPES.TERRAFORM,
      status: statusForAction(action, result.ok),
      user: user.id ?? user._id,
      config: { action, mode },
      logsRef: result.output.slice(0, 8000), // store logs (bounded)
      durationMs,
      startedAt,
      finishedAt,
      isRollbackable: action === 'apply',
      errorMessage: result.ok ? null : 'terraform command failed'
    },
    user
  );

  return {
    id: String(record.id),
    provider,
    action,
    mode,
    status: record.status,
    durationMs,
    timestamp: record.createdAt,
    logs: result.output
  };
}

/** Paginated terraform deployment history. */
export async function getHistory(query = {}) {
  const { page, limit, provider, status } = query;
  const result = await deploymentRepository.history({
    page,
    limit,
    provider,
    status,
    type: DEPLOYMENT_TYPES.TERRAFORM
  });
  return {
    ...result,
    results: result.results.map((d) => ({
      id: String(d.id),
      name: d.name,
      provider: d.provider,
      action: d.config?.action || null,
      mode: d.config?.mode || null,
      status: d.status,
      durationMs: d.durationMs,
      user: d.user?.name || 'Unknown',
      timestamp: d.createdAt
    }))
  };
}

export default { runTerraform, getHistory, TF_ACTIONS };

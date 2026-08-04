import { type FeatureFlagTargeting, type FlagValue, type RuleCondition } from '@/db/types';

/**
 * Deterministic hash function (djb2) for string to number.
 * Returns a non-negative 32-bit integer.
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Convert to unsigned 32-bit integer.
  return hash >>> 0;
}

/**
 * Executes type-safe comparison evaluations across context data metrics in-memory.
 * Safely guards against JS type coercion anomalies.
 */
function evaluateCondition(condition: RuleCondition, context: Record<string, unknown>): boolean {
  const contextValue = context[condition.attribute];
  const conditionValue = condition.value;

  // Treat both missing keys & explicit nulls as invalid context.
  if (contextValue === undefined || contextValue === null) return false;

  switch (condition.operator) {
    case 'equals':
      return contextValue === conditionValue;
    case 'not_equals':
      return contextValue !== conditionValue;
    case 'contains':
      return String(contextValue).toLowerCase().includes(String(conditionValue).toLowerCase());
    case 'not_contains':
      return !String(contextValue).toLowerCase().includes(String(conditionValue).toLowerCase());
    case 'in_list':
      // Ensure we loose-match or normalize strings to avoid type-mismatch failures
      return (
        Array.isArray(conditionValue) && conditionValue.map(String).includes(String(contextValue))
      );
    case 'not_in_list':
      return (
        Array.isArray(conditionValue) && !conditionValue.map(String).includes(String(contextValue))
      );
    case 'greater_than':
      return Number(contextValue) > Number(conditionValue);
    case 'less_than':
      return Number(contextValue) < Number(conditionValue);
    default:
      return false;
  }
}

export function evaluateTargetingRules(
  targetingRules: FeatureFlagTargeting,
  context: Record<string, unknown>,
): FlagValue {
  const { rules = [], defaultVariant = false } = targetingRules || {};
  const distinctId = context.distinctId as string | undefined;

  for (const rule of rules) {
    // Safely check if conditions array exists before evaluating
    const conditions = rule.conditions || [];
    const allConditionsMatch = conditions.every((condition) =>
      evaluateCondition(condition, context),
    );

    if (allConditionsMatch) {
      const rollout = rule.rolloutPercentage;

      // If no rollout configured immediately return the variant
      if (rollout === undefined) {
        return rule.variant;
      }

      // Rollout requires a `distinctId`. if missing, skip this rule.
      if (typeof distinctId !== 'string' || distinctId.length === 0) {
        continue;
      }

      const bucket = hashString(distinctId) % 100;
      if (bucket < rollout) {
        return rule.variant;
      }

      // Rollout failed, continue to the next rule
    }
  }

  return defaultVariant;
}

import { type FeatureFlagTargeting, type FlagValue, type RuleCondition } from '@/db/types';

/**
 * Executes type-safe comparison evaluations across context data metrics in-memory.
 * Safely guards against JS type coercion anomalies.
 */
function evaluateCondition(condition: RuleCondition, context: Record<string, unknown>): boolean {
  const contextValue = context[condition.attribute];
  const conditionValue = condition.value;

  // Treat both missing keys & explicit nulls as invalid context
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

/**
 * Loops through the db targeting jsonb block without making extra query roundtrips.
 * Uses defensive parsing to guarantee it never crashes the edge runtime.
 */
export function evaluateTargetingRules(
  targetingRules: FeatureFlagTargeting,
  context: Record<string, unknown>,
): FlagValue {
  // Prevent destructuring crashes if the jsonb structure is corrupted or null
  const { rules = [], defaultVariant = false } = targetingRules || {};

  // Process rules sequentially. The first rule to meet all conditions wins
  for (const rule of rules) {
    // Safely check if conditions array exists before evaluating
    const conditions = rule.conditions || [];

    const allConditionsMatch = conditions.every((condition) =>
      evaluateCondition(condition, context),
    );

    if (allConditionsMatch) {
      return rule.variant;
    }
  }

  return defaultVariant;
}

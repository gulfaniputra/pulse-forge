export type FlagValue = string | boolean | number | Record<string, unknown> | unknown[];

export type RuleOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'in_list'
  | 'not_in_list'
  | 'greater_than'
  | 'less_than';

export interface RuleCondition {
  attribute: string;
  operator: RuleOperator;
  value: FlagValue | FlagValue[];
}

export interface TargetingRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  variant: FlagValue;
  rolloutPercentage?: number;
}

export interface FeatureFlagTargeting {
  rules: TargetingRule[];
  defaultVariant: FlagValue;
  variants?: Array<{
    key: string;
    value: FlagValue;
  }>;
}

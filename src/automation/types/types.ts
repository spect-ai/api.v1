export type TriggerValue = {
  from?: boolean;
  to?: boolean;
  added?: string[];
  removed?: string[];
  cleared?: boolean;
};

export type ConditionValue = {
  has?: string;
  is?: string;
  hasNot?: string;
  isNot?: string;
  isEmpty?: boolean;
  isNotEmpty?: boolean;
};

export type ActionValue = {
  to?: any;
  add?: any[] | any;
  remove?: any[];
  clear?: boolean;
};

export type Condition = {
  property: string;
  value: ConditionValue;
};

export type Action = {
  property: string;
  value: ActionValue;
};

export type Automation = {
  name: string;
  triggerProperty: string;
  value: TriggerValue;
  conditions: Condition[];
  actions: Action[];
};

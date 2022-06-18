export type ValidActionId = 'statusChange' | 'columnChange';
export type ValidActions = StatusChange | ColumnChange;

export type StatusChange = {
  /**
   * The status field being changed (refer to StatusModel)
   * */
  field: string;

  /**
   * The initial status - true or false
   * */
  from: boolean;

  /**
   * The final status - true or false
   * */
  to: boolean;
};

export type ColumnChange = {
  /**
   * The initial column id
   * */
  from: string;

  /**
   * The final column id
   * */
  to: string;
};

export type Automation = {
  /**
   * The trigger id or the id of the action that triggers the automation flow
   * */
  whenId: ValidActionId;
  /**
   * The action associated with the trigger
   * */
  when: ValidActions;
  /**
   * The action id that takes place during the automation flow
   * */
  thenId: ValidActionId;
  /**
   * The action that takes place during the automation flow
   * */
  then: ValidActions;
};

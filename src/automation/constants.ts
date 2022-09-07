export const triggerIdToName = {
  statusChange: 'Status Changes',
  columnChange: 'Column Changes',
  priorityChange: 'Priority Changes',
  deadlineChange: 'Deadline Changes',
  startDateChange: 'StartDate Changes',
  assigneeChange: 'Assignee Changes',
  reviewerChange: 'Reviewer Changes',
  labelChange: 'Label Changes',
  typeChange: 'Type Changes',
  cardCreate: 'Card Created',
  cardArchive: 'Card Archived',
  cardUnarchive: 'Card Unarchived',
  allSubCardsClose: 'All Subcards Closed',
  immediateSubCardsClose: 'Immediate Subcards Closed',
  projectCreate: 'Project Created',
  columnPositionUpdate: 'Column Position Updated',
  columnCreate: 'Column Created',
  columnDelete: 'Column Deleted',
};

export const triggerIdToType = {
  statusChange: 'card',
  columnChange: 'card',
  priorityChange: 'card',
  deadlineChange: 'card',
  startDateChange: 'card',
  assigneeChange: 'card',
  reviewerChange: 'card',
  labelChange: 'card',
  typeChange: 'card',
  cardCreate: 'card',
  cardArchive: 'card',
  cardUnarchive: 'card',
  allSubCardsClose: 'card',
  immediateSubCardsClose: 'card',
  projectCreate: 'project',
  columnPositionUpdate: 'project',
  columnCreate: 'project',
  columnDelete: 'project',
};

export const actionIdToName = {
  changeStatus: 'Change Status',
  changeColumn: 'Change Column',
  changePriority: 'Change Priority',
  changeDeadline: 'Change Deadline',
  changeStartDate: 'Change StartDate',
  changeAssignee: 'Change Assignee',
  changeReviewer: 'Change Reviewer',
  changeLabels: 'Change Labels',
  changeType: 'Change Type',
  archive: 'Archive',
  unarchive: 'Unarchive',
  close: 'Close',
  open: 'Open',
  createSubCard: 'Create Subcard',
  archiveAllSubCards: 'Archive All Subcards',
  archiveImmediateSubCards: 'Archive Immediate Subcards',
  unarchiveAllSubCards: 'Unarchive All Subcards',
  unarchiveImmediateSubCards: 'Unarchive Immediate Subcards',
  closeAllSubCards: 'Close All Subcards',
  closeImmediateSubCards: 'Close Immediate Subcards',
  openAllSubCards: 'Open All Subcards',
  openImmediateSubCards: 'Open Immediate Subcards',
  callWebhook: 'Call Webhook',
  closeParentCard: 'Close Parent Card',
  openParentCard: 'Open Parent Card',
  closeOtherCardsOnTheSameLevel: 'Close Other Cards on the Same Level',
  openOtherCardsOnTheSameLevel: 'Open Other Cards on the Same Level',
  createCard: 'Create Card',
  createMultipleCards: 'Create Multiple Cards',
  createColumn: 'Create Column',
  removeColumn: 'Remove Column',
  updateColumnPosition: 'Update Column Position',
  createProject: 'Create Project',
  createCircle: 'Create Circle',
};

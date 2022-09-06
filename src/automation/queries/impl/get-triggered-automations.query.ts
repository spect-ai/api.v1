import { PerformAutomationCommandContainer } from 'src/automation/types/types';

export class GetTriggeredAutomationsQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly caller: string,
  ) {}
}

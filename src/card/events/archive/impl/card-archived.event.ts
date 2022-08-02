export class CardsArchivedEvent {
  constructor(public readonly cardIds: string[]) {}
}

export class CardArchivalRevertedEvent {
  constructor(public readonly cardIds: string[]) {}
}

import { Card } from 'src/card/model/card.model';

export class CardsArchivedEvent {
  constructor(public readonly cards: Card[]) {}
}

export class CardArchivalRevertedEvent {
  constructor(public readonly cards: Card[]) {}
}

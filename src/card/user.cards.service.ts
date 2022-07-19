import { Injectable } from '@nestjs/common';
import { CommonTools } from 'src/common/common.service';
import { MappedUser } from 'src/users/types/types';
import { UsersRepository } from 'src/users/users.repository';
import { Card } from './model/card.model';
import { MappedCard, MappedDiff } from './types/types';

@Injectable()
export class UserCardsService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly commonTools: CommonTools,
  ) {}

  getStakeholders(cards: Partial<Card>[]): {
    assignee: string[];
    reviewer: string[];
  } {
    let assignee = [];
    let reviewer = [];
    for (const card of cards) {
      if (card.assignee) assignee = [...assignee, ...card.assignee];
      if (card.reviewer) reviewer = [...reviewer, ...card.reviewer];
    }
    return {
      assignee,
      reviewer,
    };
  }

  /**
   *
   * @param mappedDiff Difference between two cards in terms of stakeholders being added or removed
   * @returns
   *
   * Find all stakeholders that are added or removed from a card and return their user objects
   */
  findUpdatedStakeholders(mappedDiff: MappedDiff): string[] {
    let userIds = [];
    for (const [cardId, cardDiff] of Object.entries(mappedDiff)) {
      const stakeholders = (cardDiff.added.assignee || [])
        .concat(cardDiff.deleted.assignee || [])
        .concat(cardDiff.added.reviewer || [])
        .concat(cardDiff.deleted.reviewer || []);
      userIds = [...userIds, ...stakeholders];
    }

    return userIds;
  }

  addCardToUsers(
    mappedUsers: MappedUser,
    stakeholders: string[],
    key: string,
    userToCards: MappedUser,
    cardId: string,
  ) {
    for (const userId of stakeholders) {
      if (!userToCards[userId])
        userToCards[userId] = {
          assignedCards: [],
          reviewingCards: [],
        };
      if (!mappedUsers[userId][key]) mappedUsers[userId][key] = [];
      userToCards[userId] = {
        ...userToCards[userId],
        [key]: mappedUsers[userId][key]
          .map((x) => x.toString())
          .includes(cardId)
          ? mappedUsers[userId][key]
          : [...mappedUsers[userId][key], cardId],
      };
    }
    return userToCards;
  }

  removeCardFromUsers(
    mappedUsers: MappedUser,
    stakeholders: string[],
    key: string,
    userToCards: MappedUser,
    cardId: string,
  ) {
    for (const userId of stakeholders) {
      if (!userToCards[userId])
        userToCards[userId] = {
          assignedCards: [],
          reviewingCards: [],
        };
      if (!mappedUsers[userId][key]) mappedUsers[userId][key] = [];

      userToCards[userId] = {
        ...userToCards[userId],
        [key]: mappedUsers[userId][key].filter((x) => x.toString() !== cardId),
      };
    }
    return userToCards;
  }

  /**
   *
   * @param mappedDiff Difference between two cards in terms of its properties being changed
   * @returns userToCards - A map of userId to all its updates, which include 4 fields in this case -
   *                        assignedCards, reviewingCards, assignedClosedCards, reviewingClosedCards
   *
   * Find all stakeholders that are added or removed from a card and return their updated user objects. If a card is closed,
   * it is added to the assignedClosedCards or reviewingClosedCards field of the user.
   */
  async updateUserCards(
    mappedDiff: MappedDiff,
    mappedCards: MappedCard,
  ): Promise<MappedUser> {
    try {
      const userToCards = {};
      const updatedStakeholders = this.findUpdatedStakeholders(mappedDiff);
      const { assignee, reviewer } = this.getStakeholders(
        Object.values(mappedCards),
      );
      const users = await this.usersRepository.findAll({
        _id: assignee.concat(reviewer).concat(updatedStakeholders),
      });
      const mappedUsers = this.commonTools.objectify(users, 'id');

      for (const [cardId, cardDiff] of Object.entries(mappedDiff)) {
        const addedAssignees = cardDiff.added.assignee || [];
        const removedAssignees = cardDiff.deleted.assignee || [];
        const addedReviewers = cardDiff.added.reviewer || [];
        const removedReviewers = cardDiff.deleted.reviewer || [];

        /** Add and remove assignees and reviewers from a card, based on the card update */
        this.addCardToUsers(
          mappedUsers,
          addedAssignees,
          'assignedCards',
          userToCards,
          cardId,
        );
        this.removeCardFromUsers(
          mappedUsers,
          removedAssignees,
          'assignedCards',
          userToCards,
          cardId,
        );
        this.addCardToUsers(
          mappedUsers,
          addedReviewers,
          'reviewingCards',
          userToCards,
          cardId,
        );
        this.removeCardFromUsers(
          mappedUsers,
          removedReviewers,
          'reviewingCards',
          userToCards,
          cardId,
        );

        if (cardDiff.updated.status?.active === false) {
          this.makeUserUpdatesForClosedCards(
            mappedUsers,
            mappedCards[cardId].assignee,
            mappedCards[cardId].reviewer,
            userToCards,
            cardId,
          );
        }

        if (cardDiff.updated.status?.active === true) {
          this.makeUserUpdatesForReopenedCards(
            mappedUsers,
            mappedCards[cardId].assignee,
            mappedCards[cardId].reviewer,
            userToCards,
            cardId,
          );
        }
      }
      return userToCards;
    } catch (error) {
      console.log(error);
      return {};
    }
  }

  makeUserUpdatesForClosedCards(
    mappedUsers: MappedUser,
    assignees: string[],
    reviewers: string[],
    userToCards: MappedUser,
    cardId: string,
  ): void {
    this.addCardToUsers(
      mappedUsers,
      assignees,
      'assignedClosedCards',
      userToCards,
      cardId,
    );
    this.addCardToUsers(
      mappedUsers,
      reviewers,
      'reviewingClosedCards',
      userToCards,
      cardId,
    );
    this.removeCardFromUsers(
      mappedUsers,
      assignees,
      'assignedCards',
      userToCards,
      cardId,
    );
    this.removeCardFromUsers(
      mappedUsers,
      reviewers,
      'reviewingCards',
      userToCards,
      cardId,
    );
  }

  makeUserUpdatesForReopenedCards(
    mappedUsers: MappedUser,
    assignees: string[],
    reviewers: string[],
    userToCards: MappedUser,
    cardId: string,
  ): void {
    this.addCardToUsers(
      mappedUsers,
      assignees,
      'assignedCards',
      userToCards,
      cardId,
    );
    this.addCardToUsers(
      mappedUsers,
      reviewers,
      'reviewingCards',
      userToCards,
      cardId,
    );
    this.removeCardFromUsers(
      mappedUsers,
      assignees,
      'assignedClosedCards',
      userToCards,
      cardId,
    );
    this.removeCardFromUsers(
      mappedUsers,
      reviewers,
      'reviewingClosedCards',
      userToCards,
      cardId,
    );
  }
}


import { Winner, Card, HandResult } from '../types';

const DECK_COUNT = 8;
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CUT_CARD_PADDING = 14;

export class BaccaratEngine {
  private shoe: Card[] = [];

  constructor() {
    this.initShoe();
  }

  private createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        let value = 0;
        if (['10', 'J', 'Q', 'K'].includes(rank)) value = 0;
        else if (rank === 'A') value = 1;
        else value = parseInt(rank);
        deck.push({ suit, rank, value });
      }
    }
    return deck;
  }

  public initShoe(): void {
    let cards: Card[] = [];
    for (let i = 0; i < DECK_COUNT; i++) {
      cards = cards.concat(this.createDeck());
    }
    // Fisher-Yates Shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    this.shoe = cards;
    this.burnCards();
  }

  private burnCards(): void {
    if (this.shoe.length === 0) return;
    const indicatorCard = this.shoe.pop()!;
    let burnCount = 0;
    
    if (['10', 'J', 'Q', 'K'].includes(indicatorCard.rank)) {
      burnCount = 10;
    } else if (indicatorCard.rank === 'A') {
      burnCount = 1;
    } else {
      burnCount = parseInt(indicatorCard.rank);
    }

    for (let i = 0; i < burnCount; i++) {
      if (this.shoe.length > 0) this.shoe.pop();
    }
  }

  private drawCard(): Card {
    if (this.shoe.length === 0) throw new Error("Shoe empty");
    return this.shoe.pop()!;
  }

  private calculateScore(cards: Card[]): number {
    const sum = cards.reduce((acc, card) => acc + card.value, 0);
    return sum % 10;
  }

  public hasCards(): boolean {
    return this.shoe.length > CUT_CARD_PADDING;
  }

  public getStrategyBet(history: HandResult[]): Winner | null {
    if (history.length === 0) return null;
    let lastMeaningfulHand: HandResult | null = null;
    
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].winner !== Winner.TIE) {
        lastMeaningfulHand = history[i];
        break;
      }
    }

    if (!lastMeaningfulHand) return null;

    const delta = Math.abs(lastMeaningfulHand.playerScore - lastMeaningfulHand.bankerScore);
    const lastWinner = lastMeaningfulHand.winner;

    if (delta >= 5) {
      return lastWinner;
    } else {
      return lastWinner === Winner.PLAYER ? Winner.BANKER : Winner.PLAYER;
    }
  }

  public dealNextHand(history: HandResult[], currentBalance: number): HandResult | null {
    if (!this.hasCards()) return null;

    const handId = history.length + 1;
    const strategyBet = this.getStrategyBet(history);
    
    const playerCards = [this.drawCard(), this.drawCard()];
    const bankerCards = [this.drawCard(), this.drawCard()];

    let playerScore = this.calculateScore(playerCards);
    let bankerScore = this.calculateScore(bankerCards);

    if (playerScore < 8 && bankerScore < 8) {
      let playerThirdCard: Card | null = null;
      if (playerScore <= 5) {
        playerThirdCard = this.drawCard();
        playerCards.push(playerThirdCard);
        playerScore = this.calculateScore(playerCards);
      }

      let bankerDraws = false;
      if (!playerThirdCard) {
        if (bankerScore <= 5) bankerDraws = true;
      } else {
        const p3Val = playerThirdCard.value;
        if (bankerScore <= 2) bankerDraws = true;
        else if (bankerScore === 3 && p3Val !== 8) bankerDraws = true;
        else if (bankerScore === 4 && [2,3,4,5,6,7].includes(p3Val)) bankerDraws = true;
        else if (bankerScore === 5 && [4,5,6,7].includes(p3Val)) bankerDraws = true;
        else if (bankerScore === 6 && [6,7].includes(p3Val)) bankerDraws = true;
      }

      if (bankerDraws) {
        bankerCards.push(this.drawCard());
        bankerScore = this.calculateScore(bankerCards);
      }
    }

    let winner = Winner.TIE;
    if (playerScore > bankerScore) winner = Winner.PLAYER;
    if (bankerScore > playerScore) winner = Winner.BANKER;

    let pnl = 0;
    let outcome: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET' = 'NO_BET';

    if (strategyBet) {
      if (winner === strategyBet) {
        pnl = 1;
        outcome = 'WIN';
      } else if (winner === Winner.TIE) {
        pnl = 0;
        outcome = 'PUSH';
      } else {
        pnl = -1;
        outcome = 'LOSS';
      }
    }

    return {
      id: handId,
      playerScore,
      bankerScore,
      winner,
      outcome,
      pnl,
      betPlaced: strategyBet,
      runningBalance: currentBalance + pnl,
      timestamp: Date.now(),
    };
  }
}

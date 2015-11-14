const GAMES = require('@anyware/game-logic/lib/constants/games');
const DefaultConfig = require('@anyware/game-logic/lib/config/default-config');

export default class Config extends DefaultConfig {
  constructor() {
    super();

    this.username = "sculpture0";

    this.GAMES_SEQUENCE = [
      GAMES.MOLE,
      GAMES.DISK,
      GAMES.SIMON
    ];
  }
}


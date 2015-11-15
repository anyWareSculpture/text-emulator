const GAMES = require('@anyware/game-logic/lib/constants/games');
const DefaultConfig = require('@anyware/game-logic/lib/config/default-config');

export default class Config extends DefaultConfig {
  constructor() {
    super();

    this.username = "sculpture0";
    this.CLIENT_CONNECTION_OPTIONS = {
      default: {
          username: "anyware",
          password: "anyware",
          host: "connect.shiftr.io"
      }
    };

    this.DISK_VIEW = {
      TURN_UPDATE_INTERVAL: 500, // ms
      MAX_POSITION: 30 // number to loop back to zero on
    };
  }

  getUserColorName(username) {
    var colors = {
      user0: "blue",
      user1: "yellow",
      user2: "pink"
    };
    return colors[this.getUserColor(username)];
  }
}


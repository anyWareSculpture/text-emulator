const events = require('events');

const COMMAND_EXIT = 'exit';
const COMMAND_HELP = 'help';

const ALL_COMMANDS = {
  [COMMAND_EXIT]: "Quit this program",
  [COMMAND_HELP]: "Show this help information"
};

export default class CommandInteractionHandler extends events.EventEmitter {
  constructor() {
    super();
  }

  processCommand(command) {
    let [commandName, ...commandArgs] = command.split(/\s+/);
    commandName = commandName.toLowerCase();

    if (commandName === COMMAND_EXIT) {
      this._quit();
    }
    else if (commandName === COMMAND_HELP) {
      this._printHelp();
    }

    this.emit("output", command);
  }

  _quit() {
    this.emit("quit");
  }

  _printHelp() {
    for (let commandName of Object.keys(ALL_COMMANDS)) {
      const commandDescription = ALL_COMMANDS[commandName];

      this.emit("output", `${commandName}\t${commandDescription}`);
    }
  }
}

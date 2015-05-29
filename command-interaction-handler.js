const events = require('events');

const COMMAND_EXIT = 'exit';
const COMMAND_HELP = 'help';
const COMMAND_AUTH = 'login';

const COMMAND_DOCS = {
  [COMMAND_EXIT]: "Quit this program",
  [COMMAND_HELP]: "Show this help information",
  [COMMAND_AUTH]: "Login using a provided username and password"
};

export default class CommandInteractionHandler extends events.EventEmitter {
  /**
   * Transforms user commands into appropriate methods on model.
   * Other recognized commands with other functions are emitted as different
   * events.
   * @constructor
   */
  constructor(sculptureModel) {
    super();

    this.sculpture = sculptureModel;
  }

  processCommand(command) {
    let [commandName, ...commandArgs] = command.split(/\s+/);
    commandName = commandName.toLowerCase();

    const commands = {
      [COMMAND_EXIT]: this._commandQuit.bind(this),
      [COMMAND_HELP]: this._commandHelp.bind(this),
      [COMMAND_AUTH]: this._commandAuthenticate.bind(this)
    };

    const commandHandler = commands[commandName];
    if (!commandHandler) {
      return this._error(`Unrecognized command ${commandName}`);
    }

    commandHandler(commandArgs);
  }

  _commandQuit() {
    this.emit("quit");
  }

  _commandHelp() {
    this._printHelp();
  }

  _commandAuthenticate(commandArgs) {
    if (commandArgs.length !== 2) {
      return this._error("Please provide a username and password");
    }

    this.emit("authenticate", ...commandArgs);
  }

  _printHelp() {
    this.emit("output", "=== HELP: ===\nType a command name followed by one or more whitespace separated arguments");
    for (let commandName of Object.keys(COMMAND_DOCS)) {
      const commandDescription = COMMAND_DOCS[commandName];

      this.emit("output", `${commandName}\t${commandDescription}`);
    }
  }

  _error(message) {
    this.emit("error", message);
  }
}

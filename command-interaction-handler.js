const events = require('events');

const COMMAND_EXIT = 'exit';
const COMMAND_HELP = 'help';
const COMMAND_AUTH = 'login';
const COMMAND_SCULPTURE = 'sculpture';

const SCULPTURE_LOCK = 'lock';
const SCULPTURE_UNLOCK = 'unlock';
const SCULPTURE_STATUS = 'status';

const COMMAND_DOCS = {
  [COMMAND_EXIT]: "Quit this program",
  [COMMAND_HELP]: "Show this help information",
  [COMMAND_AUTH]: "Login using a provided username and password",
  [COMMAND_SCULPTURE]: "Perform operations on the sculpture",
  [`${COMMAND_SCULPTURE} ${SCULPTURE_LOCK}`]: "Lock the sculpture",
  [`${COMMAND_SCULPTURE} ${SCULPTURE_UNLOCK}`]: "Unlock the sculpture",
  [`${COMMAND_SCULPTURE} ${SCULPTURE_STATUS}`]: "Status of the sculpture"
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
      [COMMAND_AUTH]: this._commandAuthenticate.bind(this),
      [COMMAND_SCULPTURE]: this._commandSculpture.bind(this)
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

  _commandSculpture(commandArgs) {
    let [sculptureCommandName, ...sculptureCommandArgs] = commandArgs;
    if (!sculptureCommandName) {
      this._printHelp();
      return;
    }
    sculptureCommandName = sculptureCommandName.toLowerCase();

    const sculptureCommands = {
      [SCULPTURE_LOCK]: this._sculptureLock.bind(this),
      [SCULPTURE_UNLOCK]: this._sculptureUnlock.bind(this),
      [SCULPTURE_STATUS]: this._sculptureStatus.bind(this)
    };

    const commandHandler = sculptureCommands[sculptureCommandName];
    if (!commandHandler) {
      return this._error(`Unrecognized command ${commandName}`);
    }

    commandHandler(sculptureCommandArgs);
  }

  _sculptureLock() {
    this.sculpture.lockSculpture();
  }

  _sculptureUnlock() {
    this.sculpture.unlockSculpture();
  }

  _sculptureStatus() {
    this._log(`Sculpture Status: ${this.sculpture.status}`);
  }

  _printHelp() {
    this._log("=== HELP: ===\nType a command name followed by one or more whitespace separated arguments");
    for (let commandName of Object.keys(COMMAND_DOCS)) {
      const commandDescription = COMMAND_DOCS[commandName];

      this._log(`${commandName}\t${commandDescription}`);
    }
  }

  _log(message) {
    this.emit("output", message);
  }

  _error(message) {
    this.emit("error", message);
  }
}

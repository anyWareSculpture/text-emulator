const blessed = require('blessed');

const {PanelsActionCreator} = require('@anyware/game-logic');

const COMMAND_PANEL = "panel";
const COMMAND_EXIT = "exit";
const COMMAND_HELP = "help";
const COMMAND_AUTH = "login";

const COMMAND_DOCS = {
  [COMMAND_EXIT]: "Quit this program",
  [COMMAND_HELP]: "Show this help information",
  [COMMAND_AUTH]: "Login using a provided username and password",
  [COMMAND_PANEL]: "Activate or deactivate a specified panel"
};

export default class CommandInput extends blessed.Form {
  static EVENT_OUTPUT = "output";
  static EVENT_ERROR = "error";
  static EVENT_QUIT = "quit";
  static EVENT_AUTH = "authenticate";

  constructor(dispatcher, options) {
    super(Object.assign({
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: '#f0f0f0'
        }
      }
    }, options));

    this.panelsActionCreator = new PanelsActionCreator(dispatcher);

    this._input = blessed.textbox({
      parent: this,
      top: 1,
      left: 0,
      width: '98%-1',
      height: 1,
      keys: true,
      mouse: true,
      inputOnFocus: true,
      style: {
        fg: 'white',
        bg: 'gray',
        focus: {
          bg: '#578594'
        }
      }
    });
    this._input.on('submit', this._submitCommand.bind(this));

    blessed.box({
      parent: this,
      top: 0,
      left: 0,
      width: '98%-1',
      height: 1,
      content: 'Enter a command:',
    });
  }

  focusInput() {
    this._input.focus();
  }

  _submitCommand() {
    this.focusInput();

    const command = this._input.getValue().trim();
    if (!command) {
      return;
    }
    this._output(command);

    this._input.clearValue();

    this._handleCommand(command);

    this.screen.render();
  }

  _output(text) {
    this.emit(CommandInput.EVENT_OUTPUT, text);
  }

  _error(text) {
    this.emit(CommandInput.EVENT_ERROR, text);
  }

  _handleCommand(command) {
    const [commandName, ...commandArgs] = command.toLowerCase().split(/\s+/);
    
    switch (commandName) {
      case COMMAND_EXIT:
        this.emit(CommandInput.EVENT_QUIT);
        break;
      case COMMAND_PANEL:
        this._commandPanel(commandArgs);
        break;
      case COMMAND_AUTH:
        this._commandAuthenticate(commandArgs);
        break;
      case COMMAND_HELP:
        this._commandHelp(commandArgs);
        break;
      default:
        this._error(`Unrecognized command: ${command}`);
        break;
    }
  }

  _commandPanel(args) {
    if (args.length !== 3) {
      this._error('Invalid number of arguments:');
      this._error('Usage: panel 1 3 1');
      return;
    }

    let [stripId, panelId, active] = args;
    if (active === "true") {
      active = true;
    }
    else if (active === "false") {
      active = false;
    }
    else {
      active = !!parseInt(active);
    }

    this.panelsActionCreator.sendPanelPressed(stripId, panelId, active);
  }

  _commandAuthenticate(args) {
    if (args.length !== 2) {
      this._error('Invalid number of arguments:');
      this._error('Usage: login <username> <password>');
      return;
    }

    [username, password] = args;
    this.emit(CommandInput.EVENT_AUTH, username, password);
  }

  _commandHelp(args) {
    this._output("Type a command name followed by one or more whitespace separated arguments");
    for (let commandName of Object.keys(COMMAND_DOCS)) {
      const commandDescription = COMMAND_DOCS[commandName];

      this._output(`${commandName}\t${commandDescription}`);
    }
  }
}

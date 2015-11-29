const blessed = require('blessed');

const SculptureActionCreator = require('@anyware/game-logic/lib/actions/sculpture-action-creator');
const DisksActionCreator = require('@anyware/game-logic/lib/actions/disks-action-creator');
const PanelsActionCreator = require('@anyware/game-logic/lib/actions/panels-action-creator');

const COMMAND_DELIMETER = ';';

const COMMAND_EXIT = "exit";
const COMMAND_HELP = "help";
const COMMAND_AUTH = "login";
const COMMAND_CLEAR = "clear";
const COMMAND_PANEL = "panel";
const COMMAND_PRESS = "press";
const COMMAND_DISK = "disk";
const COMMAND_HANDSHAKE = "handshake";

const COMMAND_DOCS = {
  [COMMAND_EXIT]: "Quit this program",
  [COMMAND_HELP]: "Show this help information",
  [COMMAND_AUTH]: "Login using a provided username and password",
  [COMMAND_CLEAR]: "Clear the output log",
  [COMMAND_PANEL]: "Activate or deactivate a specified panel",
  [COMMAND_PRESS]: "Press a panel for the given number of milliseconds",
  [COMMAND_DISK]: "Set one or more disk positions",
  [COMMAND_HANDSHAKE]: "Activates or deactivates handshake for a certain username"
};

export default class CommandInput extends blessed.Form {
  static EVENT_OUTPUT = "output";
  static EVENT_ERROR = "error";
  static EVENT_QUIT = "quit";
  static EVENT_AUTH = "authenticate";
  static EVENT_CLEAR = "clear";

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

    this.sculptureActionCreator = new SculptureActionCreator(dispatcher);
    this.panelsActionCreator = new PanelsActionCreator(dispatcher);
    this.disksActionCreator = new DisksActionCreator(dispatcher);
    this.history = [];
    this.historyIndex = this.history.length;

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
    this._input.key('up', this._historyPrevious.bind(this));
    this._input.key('down', this._historyNext.bind(this));

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

  setValue(value) {
    value = value.replace(/\n/g, "; ");
    this._input.setValue(value);
    this.focusInput();
  }

  getValue() {
    return this._input.getValue();
  }

  _submitCommand() {
    this.focusInput();

    const command = this.getValue().trim();
    if (!command) {
      return;
    }
    this.history.push(command);
    this.historyIndex = this.history.length;
    this._output(command);

    this._input.clearValue();

    command.split(COMMAND_DELIMETER).forEach((singleCommand) => {
      this._handleCommand(singleCommand.trim());
    });

    this.screen.render();
  }

  _output(text) {
    this.emit(CommandInput.EVENT_OUTPUT, text);
  }

  _error(text) {
    this.emit(CommandInput.EVENT_ERROR, text);
  }

  _historyPrevious() {
    if (this.historyIndex <= 0) {
      return;
    }

    this.historyIndex -= 1;

    this.setValue(this.history[this.historyIndex]);
  }

  _historyNext() {
    if (this.historyIndex >= this.history.length - 1) {
      return;
    }

    this.historyIndex += 1;
    this.setValue(this.history[this.historyIndex]);
  }

  _handleCommand(command) {
    const [commandName, ...commandArgs] = command.toLowerCase().split(/\s+/);

    const commandHandlers = {
      [COMMAND_EXIT]: this._commandExit.bind(this),
      [COMMAND_HELP]: this._commandHelp.bind(this),
      [COMMAND_AUTH]: this._commandAuthenticate.bind(this),
      [COMMAND_CLEAR]: this._commandClear.bind(this),
      [COMMAND_PANEL]: this._commandPanel.bind(this),
      [COMMAND_PRESS]: this._commandPress.bind(this),
      [COMMAND_DISK]: this._commandDisk.bind(this),
      [COMMAND_HANDSHAKE]: this._commandHandshake.bind(this),
    }

    const commandHandler = commandHandlers[commandName];
    if (!commandHandler) {
        this._error(`Unrecognized command: ${command}`);
        return;
    }

    commandHandler(commandArgs);
  }

  _commandExit(args) {
    this.emit(CommandInput.EVENT_QUIT);
  }

  _commandPanel(args) {
    if (args.length !== 3) {
      this._error('Usage: panel stripId panelId pressed?');
      return;
    }

    let [stripId, panelId, active] = args;
    active = this._parseBoolean(active);

    this.panelsActionCreator.sendPanelPressed(stripId, panelId, active);
  }

  _commandPress(args) {
    if (args.length !== 2 && args.length !== 3) {
      this._error(`Usage: press stripId panelId [endDelay]`);
      return;
    }

    let [stripId, panelId, ...endDelay] = args;
    endDelay = endDelay.length ? endDelay[0] : 100;

    this.panelsActionCreator.sendPanelPressed(stripId, panelId, true);
    setTimeout(() => {
      this.panelsActionCreator.sendPanelPressed(stripId, panelId, false);
    }, endDelay);
  }

  _commandAuthenticate(args) {
    if (args.length !== 2) {
      this._error('Usage: login username password');
      return;
    }

    const [username, password] = args;
    this.emit(CommandInput.EVENT_AUTH, username, password);
  }

  _commandClear(args) {
    if (args.length > 1) {
      this._error('Usage: [clearLogFile?]');
      return;
    }

    const clearLogFile = args.length === 0 ? false : this._parseBoolean(args[0]);
    this.emit(CommandInput.EVENT_CLEAR, clearLogFile);
  }

  _commandHelp(args) {
    this._output("Type a command name followed by one or more whitespace separated arguments");
    for (let commandName of Object.keys(COMMAND_DOCS)) {
      const commandDescription = COMMAND_DOCS[commandName];

      this._output(`${commandName}\t${commandDescription}`);
    }
  }

  _commandDisk(args) {
    if (args.length % 2 !== 0) {
      this._error('Usage: disk diskId position [diskId position] ...');
      return;
    }

    let diskId = null;
    for (let arg of args) {
      if (diskId === null) {
        if (!arg.startsWith("disk")) {
          arg = "disk" + arg;
        }
        diskId = arg;
      }
      else {
        this.disksActionCreator.sendDiskUpdate(diskId, {
          position: parseInt(arg)
        });
        diskId = null;
      }
    }
  }

  _commandHandshake(args) {
    if (args.length !== 2) {
      this._error('Usage: handshake username active?');
      return;
    }

    let [username, active] = args;
    active = this._parseBoolean(active);

    if (active) {
      this.sculptureActionCreator.sendHandshakeActivate(username);
    }
    else {
      this.sculptureActionCreator.sendHandshakeDeactivate(username);
    }
  }

  _parseBoolean(value) {
    return {
      "true": true,
      "on": true,
      "1": true,
      "false": false,
      "off": false,
      "0": false
    }[value];
  }
}


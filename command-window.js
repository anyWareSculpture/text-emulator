const blessed = require('blessed');

const PANEL_TITLE = "Input Panel";
const WELCOME_MESSAGE = (
      "Welcome!\n"
    + "Press Ctrl + C or type 'exit' to exit.\n");

export default class CommandWindow extends blessed.Box {
  constructor(options) {
    super(options);

    blessed.box({
      parent: this,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: PANEL_TITLE,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'gray',
        border: {
          fg: '#f0f0f0'
        }
      }
    });

    this._history = blessed.log({
      parent: this,
      top: 3,
      left: 0,
      width: '100%',
      height: '100%-7',
      content: WELCOME_MESSAGE,
      scrollable: true,
      keys: true,
      mouse: true,
      border: {
        type: 'line'
      },
      scrollbar: {
        bg: 'blue'
      },
      style: {
        fg: 'white',
        bg: 'gray',
        border: {
          fg: '#f0f0f0'
        }
      }
    });

    this._inputForm = blessed.form({
      parent: this,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 4,
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: '#f0f0f0'
        }
      }
    });

    this._input = blessed.textbox({
      parent: this._inputForm,
      top: 0,
      left: 0,
      width: '98%',
      height: '50%',
      shrink: true,
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
  }

  focusInput() {
    this._input.focus();
  }

  writeLine(text) {
    this._history.log(text);
  }

  _submitCommand() {
    this.focusInput();

    const command = this._input.getValue().trim();
    if (!command) {
      return;
    }
    this.writeLine(`> ${command}`);

    this._input.clearValue();

    this._emitCommand(command);

    this.screen.render();
  }

  _emitCommand(commandName) {
    this.emit("command", commandName);
  }
}


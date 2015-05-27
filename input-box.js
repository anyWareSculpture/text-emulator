const blessed = require('blessed');

const WELCOME_MESSAGE = (
      "Welcome!\n"
    + "Press Ctrl + C to exit.\n");

export default class InputBox extends blessed.box {
  constructor(options) {
    super(options);

    this._history = blessed.log({
      parent: this,
      top: 0,
      left: 0,
      width: '100%',
      height: '90%',
      content: WELCOME_MESSAGE,
      scrollable: true,
      keys: true,
      mouse: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'gray',
        border: {
          fg: '#f0f0f0'
        },
        scrollbar: {
          bg: 'blue'
        }
      }
    });

    this._inputForm = blessed.form({
      parent: this,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 4,
      keys: true,
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
          bg: '#5C7982'
        }
      }
    });

    this._input.focus();

    this._input.on('submit', this._submitCommand.bind(this));
  }

  _submitCommand() {
    const command = this._input.getValue();
    if (!command.trim()) {
      return;
    }
    
    const newHistory = this._history.getContent() + '\n' + command;
    this._history.setContent(newHistory);

    this._input.clearValue();
    this._input.focus();

    this.screen.render();
  }
}


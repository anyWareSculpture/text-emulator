const blessed = require('blessed');

const PANEL_TITLE = "Output Log";

export default class OutputWindowStream extends blessed.Box {
  constructor(windowOptions) {
    super(windowOptions);

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

    this._outputWindow = blessed.log({
      parent: this,
      top: 3,
      left: 0,
      width: '100%',
      height: '95%',
      scrollable: true,
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
          fg: '#f0f0f0',
        }
      }
    });
  }
  
  log(message) {
    this._outputWindow.log(message);
  }

  error(error) {
    this._outputWindow.log(error);
  }
}

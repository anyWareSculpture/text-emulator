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
      height: '100%-3',
      tags: true,
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
    const timeString = this._logTime();

    this._outputLines(message, (line) => `{blue-fg}{bold}${timeString}{/} ${line}`);
  }

  error(message) {
    const timeString = this._logTime();
    this._outputLines(message, (line) => `{red-fg}{bold}${timeString} ERROR:{/} ${line}`);
  }

  _logTime() {
    const currentDate = new Date();
    const time = currentDate.toTimeString().split(' ')[0];
    return `[${time}]`;
  }

  _outputLines(lines, formatter) {
    for (let line of lines.split('\n')) {
      this._outputWindow.log(formatter(line));
    }
  }
}

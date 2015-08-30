const fs = require('fs');

const blessed = require('blessed');

const WELCOME_MESSAGE = (
  "Welcome!\n" +
  "Press Ctrl + C or type 'exit' and hit enter to exit.\n"
);

export default class OutputWindow extends blessed.Box {
  constructor(logFilePath, windowOptions) {
    super(windowOptions);

    blessed.box({
      parent: this,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: "Output Log",
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
    this._logFile = fs.openSync(logFilePath, 'w');

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

    this._outputWindow.log(WELCOME_MESSAGE);
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
      fs.write(this._logFile, line + '\n');
    }
  }
}


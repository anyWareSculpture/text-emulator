const fs = require('fs');

const blessed = require('blessed');

const WELCOME_MESSAGE = (
  "{green-fg}" +
  "Welcome! Use the 'help' command if you're stuck.\n" +
  "Ctrl + C or type 'exit' and hit enter to exit.\n" + 
  "Ctrl + V to replace the input with the clip board contents\n" +
  "Ctrl + X to copy the entire line" +
  "{/green-fg}"
);

export default class OutputWindow extends blessed.Box {
  constructor(logFilePathMethod, windowOptions) {
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
    this._logFilePathMethod = logFilePathMethod;

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
    this._outputLines(message, (line, timeString) => `{blue-fg}{bold}${timeString}{/} ${line}`);
  }

  error(message) {
    this._outputLines(message, (line, timeString) => `{red-fg}{bold}${timeString} ERROR:{/} ${line}`);
  }

  _logTime() {
    const currentDate = new Date();
    const time = currentDate.toTimeString().split(' ')[0];
    return `[${time}]`;
  }

  _outputLines(lines, formatter) {
    const timeString = this._logTime();

    const logFile = this._logFilePathMethod();
    for (let line of lines.split('\n')) {
      this._outputWindow.log(formatter(line, timeString));
      fs.appendFileSync(logFile, `${timeString} ${line}\n`);
    }
  }
}


const blessed = require('blessed');

const CommandWindow = require('./command-window');

const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true
});

const commandWindow = new CommandWindow({
  parent: screen,
  top: 0,
  left: 0,
  width: '50%',
  height: '100%'
});
commandWindow.focusInput();

screen.key(['C-c'], function(ch, key) {
  return process.exit(0);
});

screen.title = 'anyWare Emulator';

// Render the screen.
screen.render();

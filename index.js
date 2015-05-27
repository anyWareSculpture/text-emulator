const blessed = require('blessed');

const CommandWindow = require('./command-window');
const CommandInteractionHandler = require('./command-interaction-handler');
const LogWindow = require('./log-window');

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

const outputConsole = new LogWindow({
  parent: screen,
  top: 0,
  left: '50%',
  width: '50%',
  height: '100%'
});

const interactionHandler = new CommandInteractionHandler(outputConsole);
commandWindow.on("command", (c) => {
  interactionHandler.processCommand(c);
});

screen.key(['C-c'], function(ch, key) {
  return process.exit(0);
});

screen.title = 'anyWare Emulator';

// Render the screen.
screen.render();

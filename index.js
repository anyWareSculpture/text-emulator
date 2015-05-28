const blessed = require('blessed');

const CommandWindow = require('./command-window');
const CommandInteractionHandler = require('./command-interaction-handler');
const LogWindow = require('./log-window');

require('babel/register')({
  only: /@anyware/
});
const StreamingClient = require('@anyware/streaming-client');

const DEFAULT_CLIENT_CONNECTION = {
  protocol: "ws",
  username: "anyware",
  password: "anyware",
  host: "connect.shiftr.io:1884"
};

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

const defaultClient = new StreamingClient(DEFAULT_CLIENT_CONNECTION);

const interactionHandler = new CommandInteractionHandler();
commandWindow.on("command", (c) => {
  interactionHandler.processCommand(c);
});

interactionHandler.on("output", (output) => {
  outputConsole.log(output);
});
interactionHandler.on("error", (error) => {
  outputConsole.error(output);
});

function quit() {
  return process.exit(0);
}

interactionHandler.on("quit", quit);
screen.key(['C-c'], quit);

screen.title = 'anyWare Emulator';

screen.render();

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
  username: process.argv[2] || "anyware",
  password: process.argv[3] || "anyware",
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

function handleError(error) {
  const errorMessage = error.message || error;

  outputConsole.error(errorMessage)
}

function setupClient(options) {
  const settings = Object.assign({}, DEFAULT_CLIENT_CONNECTION, options || {});

  outputConsole.log(`Using username ${settings.username}`);

  const client = new StreamingClient(settings);
  
  const updateConnectionStatus = () => {
    outputConsole.log(`Client Connected: ${client.connected}`);
  };
  client.on(StreamingClient.EVENT_CONNECT, updateConnectionStatus);
  client.on(StreamingClient.EVENT_DISCONNECT, updateConnectionStatus);

  client.on(StreamingClient.EVENT_ERROR, (error) => {
    handleError(error);
  });

  return client;
}

let client = setupClient();

const interactionHandler = new CommandInteractionHandler();
commandWindow.on("command", (c) => {
  interactionHandler.processCommand(c);
});

interactionHandler.on("authenticate", (username, password) => {
  if (client) {
    client.close();
  }

  client = setupClient({
    username: username,
    password: password
  });
});

interactionHandler.on("output", (output) => {
  outputConsole.log(output);
});
interactionHandler.on("error", (error) => {
  handleError(error);
});

function quit() {
  return process.exit(0);
}

interactionHandler.on("quit", quit);
screen.key(['C-c'], quit);

screen.title = 'anyWare Emulator';

screen.render();

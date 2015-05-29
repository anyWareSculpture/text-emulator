const blessed = require('blessed');

const CommandWindow = require('./command-window')
const LogWindow = require('./log-window');
const CommandInteractionHandler = require('./command-interaction-handler');

// @anyware components need to be transpiled
require('babel/register')({only: /@anyware/});
const StreamingClient = require('@anyware/streaming-client');
const {GameConstants, Sculpture} = require('@anyware/game-logic');

const FRAMES_PER_SECOND = 60;
const MILLISECONDS_PER_SECOND = 1000;

export default class Emulator {
  constructor() {
    this.screen = this._createApplicationScreen();
    
    this.outputConsole = null;
    this.commandWindow = null;
  
    this.client = null;
    this.sculpture = null;
    
    this._connectionOptions = {};
    this._isSetup = false;

    this._layoutScreen();
  }
  
  /**
   * Renders the main application screen
   */
  render() {
    this.screen.render();
  }

  /**
   * Quits the application
   */
  quit() {
    process.exit(0);
  }

  /**
   * Connects to the streaming server and sets up the rest of the application
   * This must be called before beginning the loop
   */
  connectAndSetup(options) {
    this._connectionOptions = options;
    this._setupStreamingClient();
    
    this._setupModels();
    this._setupInteractionHandler();

    this._isSetup = true;
  }

  /**
   * Begins/Asynchronously schedules the main loop
   * The application's behaviour is not defined if this function is called
   * more than once.
   */
  beginLoop() {
    if (!this._isSetup) {
      throw new Error("Cannot begin loop without being setup");
    }

    setInterval(this._loop.bind(this), MILLISECONDS_PER_SECOND / FRAMES_PER_SECOND).unref();
  }

  _log(message) {
    this.outputConsole.log(message);
  }

  _error(error) {
    const errorMessage = error.message || error;

    this.outputConsole.error(errorMessage);
  }

  _createApplicationScreen() {
    const screen = blessed.screen({
      autoPadding: true,
      smartCSR: true
    });
    screen.key(['C-c'], this.quit.bind(this));

    screen.title = 'anyWare Emulator';

    return screen;
  }

  _layoutScreen() {
    this._setupCommandWindow();
    this._setupOutputConsole();
  }

  _setupCommandWindow() {
    this.commandWindow = new CommandWindow({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '50%',
      height: '100%'
    });
    this.commandWindow.focusInput();
  }

  _setupOutputConsole() {
    this.outputConsole = new LogWindow({
      parent: this.screen,
      top: 0,
      left: '50%',
      width: '50%',
      height: '100%'
    });
  }

  _setupStreamingClient() {
    if (this.client) {
      this.client.close();
    }

    this._log(`Using username ${this._connectionOptions.username}`);

    this.client = new StreamingClient(this._connectionOptions);

    this.client.on(StreamingClient.EVENT_CONNECT, this._onConnectionStatusChange.bind(this));
    this.client.on(StreamingClient.EVENT_DISCONNECT, this._onConnectionStatusChange.bind(this));

    this.client.on(StreamingClient.EVENT_ERROR, this._error.bind(this));

    //TODO: Bind to state updates and commands incoming
  }

  _onConnectionStatusChange() {
    this._log(`Client Connected: ${this.client.connected}`);
  }

  _setupModels() {
    this.sculpture = new Sculpture();

    this.sculpture.on(GameConstants.EVENT_UPDATE, this._handleStateUpdate.bind(this));
  }

  _handleStateUpdate(update) {
    this._log(`Sending state update ${update}`);
    this.client.sendStateUpdate(update);
  }

  _setupInteractionHandler() {
    const interactionHandler = new CommandInteractionHandler(this.sculpture);
    interactionHandler.on("output", this._log.bind(this));
    interactionHandler.on("error", this._error.bind(this));
    interactionHandler.on("quit", this.quit.bind(this));
    interactionHandler.on("authenticate", this._handleAuthentication.bind(this));

    this.commandWindow.on("command", interactionHandler.processCommand.bind(interactionHandler));
  }

  _handleAuthentication(username, password) {
    this._connectionOptions.username = username;
    this._connectionOptions.password = password;

    this._setupStreamingClient();
  }

  _loop() {
    this.sculpture.onFrame();

    this._renderState();
  }

  _renderState() {
    if (this.sculpture.currentGame.isKnocking) {
      this._log(`Knock!`);
    }
  }
}

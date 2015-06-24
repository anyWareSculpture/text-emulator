const blessed = require('blessed');

const {Dispatcher} = require('flux');

const OutputWindow = require('./output-window');
const PanelView = require('./views/panel-view');
const SculptureView = require('./views/sculpture-view');

const CommandInput = require('./command-input');

const StreamingClient = require('@anyware/streaming-client');
const {SculptureStore} = require('@anyware/game-logic');

export default class EmulatorApp {
  constructor() {
    this.screen = this._createApplicationScreen();
    
    this.sculptureView = null;
    this.panelView = null;
    this.diskView = null;
    this.commandInput = null;
    this.outputConsole = null;
    
    this.client = null;
    this._connectionOptions = {};

    this.dispatcher = new Dispatcher();
    this.dispatcher.register((payload) => {
      this.outputConsole.log(`Sent action: ${JSON.stringify(payload)}`);
    });

    this.sculpture = new SculptureStore(this.dispatcher);
    this.sculpture.on(SculptureStore.EVENT_CHANGE, (changes) => {
      this.outputConsole.log(`Store changed: ${JSON.stringify(changes)}`);
    });

    this._layoutScreen();
  }

  quit() {
    process.exit(0);
  }

  /**
   * Connects to the streaming server and sets up the rest of the application
   */
  connectAndSetup(options) {
    this._connectionOptions = options;
    this._setupStreamingClient();
  }
  
  /**
   * Renders the main application screen
   */
  render() {
    this.screen.render();
  }

  _log(message) {
    this.outputConsole.log(message);
  }

  _error(error) {
    const errorMessage = error.stack || error.message || error;

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
    this._setupOutputConsole();
    this._setupViews();
    this._setupCommandInput();
  }

  _setupViews() {
    this.sculptureView = new SculptureView(this.sculpture, {
      parent: this.screen,
      top: 0,
      left: 0,
      width: '50%',
      height: 4
    });

    this.panelView = new PanelView(this.sculpture, {
      parent: this.screen,
      top: 4,
      left: 0,
      width: '50%',
      height: 7
    });
  }

  _setupCommandInput() {
    this.commandInput = new CommandInput(this.dispatcher, {
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '50%',
      height: 4
    });
    this.commandInput.focusInput();

    this.commandInput.on(CommandInput.EVENT_OUTPUT, (text) => {
      this.outputConsole.log(text);
    });

    this.commandInput.on(CommandInput.EVENT_ERROR, (text) => {
      this.outputConsole.error(text);
    });

    this.commandInput.on(CommandInput.EVENT_AUTH, (username, password) => {
      this._connectionOptions.username = username;
      this._connectionOptions.password = password;

      this._setupStreamingClient(); 
    });

    this.commandInput.on(CommandInput.EVENT_QUIT, (text) => {
      this.quit();
    });
  }

  _setupOutputConsole() {
    this.outputConsole = new OutputWindow({
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

    this.client.once(StreamingClient.EVENT_CONNECT, () => {
      // Temporarily here until the full game transitions are implemented
      if (!this.sculpture.isPlayingMoleGame) {
        this._log("Starting mole game...");
        this.sculpture.startMoleGame();
      }
    });

    //TODO: Bind to state updates and commands incoming
  }

  _onConnectionStatusChange() {
    this._log(`Client Connected: ${this.client.connected}`);
  }
}

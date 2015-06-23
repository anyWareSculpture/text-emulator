const blessed = require('blessed');

const OutputWindow = require('./output-window');

const StreamingClient = require('@anyware/streaming-client');

export default class EmulatorApp {
  constructor() {
    this.screen = this._createApplicationScreen();
    
    this.sculptureView = null;
    this.panelView = null;
    this.diskView = null;
    this.commandInput = null;
    this.outputConsole = null;
    
    this.client = null;
    this.sculpture = null;

    this._connectionOptions = {};

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
    this._setupViews();
    this._setupCommandInput();
    this._setupOutputConsole();
  }

  _setupViews() {

  }

  _setupCommandInput() {

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

    //TODO: Bind to state updates and commands incoming
  }

  _onConnectionStatusChange() {
    this._log(`Client Connected: ${this.client.connected}`);
  }
}

const clipboard = require('copy-paste');
const blessed = require('blessed');

const {Dispatcher} = require('flux');

import OutputWindow from './output-window';
import SculptureView from './views/sculpture-view';
import PanelView from './views/panel-view';
import DiskView from './views/disk-view';
import CommandInput from './command-input';
import StateUpdateFilter from './state-update-filter';
import StreamingClient from 'anyware/lib/streaming-client';
import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import SculptureActionCreator from 'anyware/lib/game-logic/actions/sculpture-action-creator';

export default class EmulatorApp {
  constructor(config) {
    this.screen = this._createApplicationScreen();

    this.config = config;

    this.sculptureView = null;
    this.panelView = null;
    this.diskView = null;
    this.commandInput = null;
    this.outputConsole = null;

    this.client = null;
    this._connectionOptions = {};
    this.stateUpdateFilter = new StateUpdateFilter();

    this.dispatcher = new Dispatcher();
    this.dispatcher.register((payload) => {
      this._log(`Sent action: ${JSON.stringify(payload)}`);
    });

    this.sculpture = new SculptureStore(this.dispatcher, this.config);
    this.sculpture.on(SculptureStore.EVENT_CHANGE, (changes) => {
      this._log(`Sent state update: ${JSON.stringify(changes)}`);

      const baseMetadata = {timestamp: Date.now()};
      const {update, metadata} = this.stateUpdateFilter.processOutgoingStateUpdate(changes, baseMetadata);
      this.client.sendStateUpdate(update, metadata);
    });
    this.sculptureActionCreator = new SculptureActionCreator(this.dispatcher);

    this._layoutScreen();
  }

  copyAll() {
    const value = this.commandInput.getValue();
    clipboard.copy(value);
  }

  pasteReplace() {
    clipboard.paste((err, value) => {
      if (err) {
        this._err(err);
        return;
      }
      this.commandInput.setValue(value.trim());
    });
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

  get _username() {
    return this.config.username;
  }

  _log(message) {
    this.outputConsole.log(message);
  }

  _error(error) {
    let errorMessage;
    try {
      errorMessage = error.stack || error.toString();
    }
    catch (stackError) {
      errorMessage = error.toString();
    }

    this.outputConsole.error(errorMessage);
  }

  _createApplicationScreen() {
    const screen = blessed.screen({
      autoPadding: true,
      smartCSR: true,
      debug: true,
      ignoreLocked: ['C-c', 'C-v', 'C-x', 'f12']
    });
    screen.key(['C-c'], this.quit.bind(this));
    screen.key(['C-x'], this.copyAll.bind(this));
    screen.key(['C-v'], this.pasteReplace.bind(this));

    screen.title = 'anyWare Emulator';

    return screen;
  }

  _layoutScreen() {
    this._setupOutputConsole();
    this._setupViews();
    this._setupCommandInput();
  }

  _setupViews() {
    let totalHeight = 0;

    const sculptureViewHeight = 7;
    this.sculptureView = new SculptureView(this.sculpture, this.config, {
      parent: this.screen,
      top: 0,
      left: 0,
      width: '50%',
      height: sculptureViewHeight
    });
    totalHeight += sculptureViewHeight;

    const panelViewHeight = 7;
    this.panelView = new PanelView(this.sculpture, this.config, this.dispatcher, {
      parent: this.screen,
      top: totalHeight,
      left: 0,
      width: '50%',
      height: panelViewHeight
    });
    totalHeight += panelViewHeight;

    const diskViewHeight = 6;
    this.diskView = new DiskView(this.sculpture, this.config, this.dispatcher, {
      parent: this.screen,
      top: totalHeight,
      left: 0,
      width: '50%',
      height: diskViewHeight
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
      this._log(text);
    });

    this.commandInput.on(CommandInput.EVENT_ERROR, (text) => {
      this._error(text);
    });

    this.commandInput.on(CommandInput.EVENT_AUTH, (username, password) => {
      this._connectionOptions.username = username;
      this._connectionOptions.password = password;

      this._setupStreamingClient();
    });

    this.commandInput.on(CommandInput.EVENT_CLEAR, (clearLogFile) => {
      this.outputConsole.clear();

      if (clearLogFile) {
        this.outputConsole.clearLogFile();
      }
    });

    this.commandInput.on(CommandInput.EVENT_QUIT, (text) => {
      this.quit();
    });
  }

  _setupOutputConsole() {
    this.outputConsole = new OutputWindow(() => {
      let log = "output.log";
      if (this._username) {
        log = `${this._username}-${log}`;
      }
      return log;
    }, {
      parent: this.screen,
      top: 0,
      left: '50%',
      width: '50%',
      height: '100%'
    });
  }

  _setupStreamingClient() {
    this._log('setupStreamingClient()');
    if (this.client) {
      this.client.close();
    }

    this._log(`Using username ${this._username}`);
    this._log(`options ${JSON.stringify(this._connectionOptions)}`);

    this.client = new StreamingClient(this._connectionOptions);

    this.client.on(StreamingClient.EVENT_CONNECT, this._onConnectionStatusChange.bind(this));
    this.client.on(StreamingClient.EVENT_DISCONNECT, this._onConnectionStatusChange.bind(this));

    this.client.on(StreamingClient.EVENT_ERROR, this._error.bind(this));

    this.client.once(StreamingClient.EVENT_CONNECT, () => {
      //TODO: Temporarily here until the full game transitions are implemented
      if (this.sculpture.isPlayingNoGame) {
        const game = this.config.GAMES_SEQUENCE[0];
        this._log(`Starting ${game} game...`);
        this.sculptureActionCreator.sendStartGame(game);
      }
    });

    this.client.on(StreamingClient.EVENT_STATE_UPDATE, this._onStateUpdate.bind(this));
  }

  _onConnectionStatusChange() {
    this._log(`Client Connected: ${this.client.connected}`);
  }

  _onStateUpdate(update, metadata) {
    if (metadata.from === this._username) {
      this._log(`Got state update from self (ignored): ${JSON.stringify(update)}`);
      return;
    }

    ({update, metadata} = this.stateUpdateFilter.processIncomingStateUpdate(update, metadata));
    if (!Object.keys(update).length) {
      this._log('Ignored all changes from received update since they were stale');

      this.stateUpdateFilter.clearStagedUpdate();
      return;
    }
    update.metadata = metadata;

    this._log(`Got state update: ${JSON.stringify(update)}`);

    this.sculptureActionCreator.sendMergeState(update);
  }
}

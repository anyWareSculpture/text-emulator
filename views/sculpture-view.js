const blessed = require('blessed');

import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import MoleGameLogic from 'anyware/lib/game-logic/logic/mole-game-logic';
import DiskGameLogic from 'anyware/lib/game-logic/logic/disk-game-logic';
import SimonGameLogic from 'anyware/lib/game-logic/logic/simon-game-logic';

const VIEW_TITLE = "{center}{bold}Sculpture{/bold}{/center}";

export default class SculptureView extends blessed.Box {
  constructor(store, config, windowOptions) {
    super(Object.assign({
      tags: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'gray'
      }
    }, windowOptions));

    this.store = store;
    this.config = config;
    this.renderSculptureProperties();

    this.store.on(SculptureStore.EVENT_CHANGE, this.renderSculptureProperties.bind(this));
  }

  renderSculptureProperties() {
    let content = VIEW_TITLE + '\n';
    content += `{yellow-fg}status:{/yellow-fg} ${this.store.data.get('status')}\n`;

    content += this.renderHandshakes();
    content += this.renderCurrentGameProperties();

    this.setContent(content);
  }

  renderHandshakes() {
    const handshakes = this.store.data.get("handshakes");

    var rendered = [];
    for (let username of handshakes) {
      const value = handshakes.get(username);
      if (!value) {
        continue;
      }

      let renderContent = `{yellow-fg}${username}:{/yellow-fg} `;
      renderContent += `{bold}{green-fg}${value}{/green-fg}{/bold}`;

      rendered.push(renderContent);
    }

    let content = "{yellow-fg}handshakes:{/yellow-fg}\n";
    if (rendered.length) {
      content += rendered.join(", ");
    }
    else {
      content += "nothing yet."
    }

    return content + '\n';
  }

  renderCurrentGameProperties() {
    if (this.store.isPlayingHandshakeGame) {
      return this.renderHandshakeGameProperties();
    }
    else if (this.store.isPlayingMoleGame) {
      return this.renderMoleGameProperties();
    }
    else if (this.store.isPlayingDiskGame) {
      return this.renderDiskGameProperties();
    }
    else if (this.store.isPlayingSimonGame) {
      return this.renderSimonGameProperties();
    }
    else {
      return 'No game currently being played';
    }
  }

  renderHandshakeGameProperties() {
    let content = '{yellow-fg}handshake:{/yellow-fg} (N/A)';
    return content;
  }

  renderMoleGameProperties() {
    let content = '{yellow-fg}mole:{/yellow-fg} ';

    const moleGame = this.store.data.get('mole');
    for (let propName of Object.keys(MoleGameLogic.trackedProperties)) {
      content += `{yellow-fg}${propName}:{/yellow-fg} ${moleGame.get(propName)}  `;
    }

    return content;
  }

  renderDiskGameProperties() {
    let content = '{yellow-fg}disk:{/yellow-fg} ';
    
    const diskGame = this.store.data.get('disk');
    for (let propName of Object.keys(DiskGameLogic.trackedProperties)) {
      content += `{yellow-fg}${propName}:{/yellow-fg} ${diskGame.get(propName)}  `;
    }

    return content;
  }

  renderSimonGameProperties() {
    let content = '{yellow-fg}simon:{/yellow-fg} ';
    
    const simonGame = this.store.data.get('simon');
    for (let propName of Object.keys(SimonGameLogic.trackedProperties)) {
      content += `{yellow-fg}${propName}:{/yellow-fg} ${simonGame.get(propName)}  `;
    }

    return content;
  }
}


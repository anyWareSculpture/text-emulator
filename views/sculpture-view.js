const blessed = require('blessed');

const {SculptureStore, MoleGameLogic} = require('@anyware/game-logic');

const VIEW_TITLE = "{center}{bold}Sculpture{/bold}{/center}";

export default class SculptureView extends blessed.Box {
  constructor(store, windowOptions) {
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
    this.renderSculptureProperties();

    this.store.on(SculptureStore.EVENT_CHANGE, this.renderSculptureProperties.bind(this));
  }

  renderSculptureProperties() {
    let content = VIEW_TITLE + '\n';
    content += `{yellow-fg}status:{/yellow-fg} ${this.store.data.get('status')}\n`;

    content += this.renderCurrentGameProperties();

    this.setContent(content);
  }

  renderCurrentGameProperties() {
    if (this.store.isPlayingMoleGame) {
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
    
    //TODO: Fill this in

    return content;
  }

  renderSimonGameProperties() {
    let content = '{yellow-fg}simon:{/yellow-fg} ';
    
    //TODO: Fill this in

    return content;
  }
}


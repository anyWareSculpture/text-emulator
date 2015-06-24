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

    if (this.store.isPlayingMoleGame) {
      content += '{yellow-fg}mole:{/yellow-fg} ';

      const moleGame = this.store.data.get('mole');
      for (let propName of Object.keys(MoleGameLogic.trackedProperties)) {
        content += `{yellow-fg}${propName}:{/yellow-fg} ${moleGame.get(propName)}  `;
      }
    }
    else {
      content += 'No game currently being played'
    }

    this.setContent(content);
  }
}

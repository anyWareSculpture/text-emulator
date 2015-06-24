const blessed = require('blessed');

const {SculptureStore} = require('@anyware/game-logic');

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
    content += `{yellow-fg}status:{/yellow-fg} ${this.store.data.get('status')}`;
    this.setContent(content);
  }
}

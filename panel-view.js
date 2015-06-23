const blessed = require('blessed');

const {GameConstants} = require('@anyware/game-logic');

export default class PanelView extends blessed.Box {
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
    this.renderPanels();

    this.store.on(GameConstants.EVENT_CHANGE, this.renderPanels.bind(this));
  }

  renderPanels() {
    const lightArray = this.store.data.get('lights');
    const output = [for (stripId of lightArray) this.formatStrip(lightArray.get(stripId))];
    this.setContent(output.join('\n'));
  }

  formatStrip(strip) {
    const formattedPanels = [];
    for (let panelId of strip.panelIds) {
      const panel = strip.get(panelId);
      const formattedPanel = this.formatPanel(panel);
      formattedPanels.push(formattedPanel);
    }

    return formattedPanels.join(' ');
  }

  formatPanel(panel) {
    return `${panel.get('intensity')}`;
  }
}

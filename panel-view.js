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
    const formattedStrips = Array.from(this.formatStrips(lightArray));
    this.setContent(formattedStrips.join('\n'));
  }

  *formatStrips(lightArray) {
    for (let stripId of lightArray.stripIds) {
      const formattedPanels = Array.from(this.formatStripPanels(lightArray, stripId));
      yield `${stripId}: ${formattedPanels.join(' ')}`;
    }
  }

  *formatStripPanels(lightArray, stripId) {
    const strip = lightArray.get(stripId);
    for (let panelId of strip.panelIds) {
      yield this.formatPanel(lightArray, stripId, panelId);
    }
  }

  formatPanel(lightArray, stripId, panelId) {
    const panelIntensity = lightArray.getIntensity(stripId, panelId);

    const cellWidth = 3;
    // pad cell to cellWidth and right align in cell
    let formattedPanel = ((' '.repeat(cellWidth)) + panelIntensity).slice(-cellWidth);

    if (panelIntensity > 50) {
      formattedPanel = `{bold}${formattedPanel}{/bold}`;
    }

    const panelColor = this._colorFromKeyword(lightArray.getColor(stripId, panelId));
    if (panelColor) {
      formattedPanel = `{${panelColor}-fg}${formattedPanel}{/${panelColor}-fg}`;
    }

    const panelActive = lightArray.isActive(stripId, panelId);
    if (panelActive) {
      formattedPanel = `{white-bg}${formattedPanel}{/white-bg}`;
    }

    return formattedPanel;
  }

  _colorFromKeyword(keyword) {
    switch (keyword) {
      case "success":
        return "green";
      case "error":
        return "red";
      default:
        return;
    }
  }
}

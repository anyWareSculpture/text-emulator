import blessed from 'blessed';

import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import SculptureActionCreator from 'anyware/lib/game-logic/actions/sculpture-action-creator';
import PanelAnimations from './animations/panel-animations';

const VIEW_TITLE = "{center}{bold}Panels{/bold}{/center}";
const CELL_WIDTH = 3;

export default class PanelView extends blessed.Box {
  constructor(store, config, dispatcher, windowOptions) {
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

    this.sculptureActionCreator = new SculptureActionCreator(dispatcher);

    this._animating = false;

    this.renderPanels();
    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  renderPanels() {
    const lightArray = this.store.data.get('lights');
    
    let content = this.formatPanelIDs(lightArray) + '\n';

    const formattedStrips = Array.from(this.formatStrips(lightArray));
    content += formattedStrips.join('\n');

    this.setBodyContent(content);
  }

  _handleChanges(changes) {
    if (this._animating) {
      return;
    }
    this._handleStatusChanges(changes);

    this.renderPanels();
  }

  /**
   * Sets the view's body content to the given content leaving the title
   * and any other pertinent details in tact
   */
  setBodyContent(bodyContent) {
    let content = VIEW_TITLE + '\n';
    content += bodyContent;
    this.setContent(content);
  }

  formatPanelIDs(lightArray) {
    let longestPanelIdList = null;
    for (let stripId of lightArray.stripIds) {
      const panelIds = lightArray.get(stripId).panelIds;
      if (!longestPanelIdList || panelIds.length > longestPanelIdList.length) {
        longestPanelIdList = panelIds;
      }
    }

    let result = '{yellow-fg}ID';
    for (let panelId of longestPanelIdList) {
      result += ' ' + ((' '.repeat(CELL_WIDTH)) + panelId).slice(-CELL_WIDTH);
    }
    result += '   | max{/yellow-fg}';

    return result;
  }

  *formatStrips(lightArray) {
    const maxIntensityWidth = 3;
    for (let stripId of lightArray.stripIds) {
      const formattedPanels = Array.from(this.formatStripPanels(lightArray, stripId));

      const max = '  {yellow-fg}|{/yellow-fg} ' + ((' '.repeat(maxIntensityWidth)) + lightArray.getMaxIntensity(stripId)).slice(-maxIntensityWidth);
      yield `{yellow-fg}${stripId}:{/yellow-fg} ${formattedPanels.join(' ')} ${max}`;
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

    // pad cell to CELL_WIDTH and right align in cell
    let formattedPanel = ((' '.repeat(CELL_WIDTH)) + panelIntensity).slice(-CELL_WIDTH);

    if (panelIntensity > 50) {
      formattedPanel = `{bold}${formattedPanel}{/bold}`;
    }

    const panelColor = this._colorFromKeyword(lightArray.getColor(stripId, panelId));
    if (panelColor) {
      formattedPanel = `{${panelColor}-fg}${formattedPanel}{/${panelColor}-fg}`;
    }

    const panelActive = lightArray.isActive(stripId, panelId);
    if (panelActive) {
      formattedPanel = `{bright-cyan-bg}${formattedPanel}{/bright-cyan-bg}`;
    }

    return formattedPanel;
  }

  _colorFromKeyword(keyword) {
    const keywordColors = {
      success: "green",
      error: "red"
    };
    return keywordColors[keyword] || this.config.getUserColorName(keyword) || keyword;
  }

  _handleStatusChanges(changes) {
    const status = changes.status;

    const statusHandlers = {
      [SculptureStore.STATUS_SUCCESS]: this._playSuccessAnimation.bind(this),
      [SculptureStore.STATUS_FAILURE]: this._playFailureAnimation.bind(this)
    }

    const handler = statusHandlers[status];
    if (handler) {
      handler();
    }
  }

  _playSuccessAnimation() {
    PanelAnimations.playSuccessAnimation(this, this._animationComplete.bind(this));
  }

  _playFailureAnimation() {
    PanelAnimations.playFailureAnimation(this, this._animationComplete.bind(this));
  }

  _animationComplete() {
    this._animating = false;
    this.sculptureActionCreator.sendFinishStatusAnimation();

    this.renderPanels();
  }
}

const blessed = require('blessed');

const {SculptureStore} = require('@anyware/game-logic');

const VIEW_TITLE = "{center}{bold}Disks{/bold}{/center}";
const CELL_WIDTH = 3;

export default class PanelView extends blessed.Box {
  constructor(store, dispatcher, windowOptions) {
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

    this._animating = false;

    this.renderDisks();
    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  renderDisks() {
    const disks = this.store.data.get('disks');
    
    const content = Array.from(this.formatDisks(disks)).join('\n');

    this.setBodyContent(content);
  }

  _handleChanges() {
    this._playAvailableAnimations()
    if (this._animating) {
      return;
    }

    this.renderDisks();
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

  *formatDisks(disks) {
    for (let diskId of disks) {
      const disk = disks.get(diskId);
      
      yield this.formatDisk(diskId, disk);
    }
  }

  formatDisk(diskId, disk) {
    let formattedDisk =`{yellow-fg}${diskId}:{/yellow-fg}  `;
    formattedDisk += `{yellow-fg}POS:{/yellow-fg} ${disk.getPosition()} `;
    formattedDisk += `{yellow-fg}DIR:{/yellow-fg} ${disk.getDirection()} `;
    formattedDisk += `{yellow-fg}STATE:{/yellow-fg} ${disk.getState()} `;
    formattedDisk += `{yellow-fg}USER:{/yellow-fg} '${disk.getUser()}'`;
    return formattedDisk;
  }

  _colorFromKeyword(keyword) {
    const colorMappings = {
      success: "green",
      error: "red"
    };
    
    return colorMappings[keyword] || "";
  }

  _playAvailableAnimations() {
    if (this._animating) {
      return;
    }
  }
}

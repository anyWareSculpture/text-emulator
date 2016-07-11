const blessed = require('blessed');

import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import DisksActionCreator from 'anyware/lib/game-logic/actions/disks-action-creator';
import Disk from 'anyware/lib/game-logic/utils/disk';

const VIEW_TITLE = "{center}{bold}Disks{/bold}{/center}";
const CELL_WIDTH = 3;

export default class DiskView extends blessed.Box {
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
    this.viewConfig = this.config.DISK_VIEW;

    this._disksActionCreator = new DisksActionCreator(dispatcher);

    this.renderDisks();
    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));

    setInterval(this._updateDiskPositions.bind(this), this.viewConfig.TURN_UPDATE_INTERVAL);
  }

  renderDisks() {
    const disks = this.store.data.get('disks');
    
    const content = Array.from(this.formatDisks(disks)).join('\n');

    this.setBodyContent(content);
  }

  resetDisks() {
    // emulate the sculpture by doing this after a small interval
    setTimeout(() => {
      const disks = this.store.data.get('disks');

      for (let diskId of disks) {
        this._disksActionCreator.sendDiskUpdate(diskId, {
          position: 0
        });
      }
    }, 1000);
  }

  _handleChanges(changes) {
    if (changes.hasOwnProperty('disk') && changes.disk.hasOwnProperty('level')) {
      this.resetDisks();
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

    const formattedPos = (" " + disk.getPosition()).slice(-2);
    formattedDisk += `{yellow-fg}POS:{/yellow-fg} ${formattedPos} `;

    let formattedDir = this._lpad({
      [Disk.CLOCKWISE]: "+1",
      [Disk.COUNTERCLOCKWISE]: "-1",
      [Disk.STOPPED]: "0",
      [Disk.CONFLICT]: "x"
    }[disk.getDirection()], 2);

    formattedDisk += `{yellow-fg}DIR:{/yellow-fg} ${formattedDir} `;

    formattedDisk += `{yellow-fg}STATE:{/yellow-fg} ${disk.getState()} `;
    formattedDisk += `{yellow-fg}USER:{/yellow-fg} '${disk.getUser()}'`;
    return formattedDisk;
  }

  _lpad(str, width) {
    return (" ".repeat(width) + str).slice(-width);
  }

  _colorFromKeyword(keyword) {
    const colorMappings = {
      success: "green",
      error: "red"
    };
    
    return colorMappings[keyword] || "";
  }

  _updateDiskPositions() {
    const disks = this.store.data.get('disks');
    
    for (let diskId of disks) {
      const disk = disks.get(diskId);
      let position = disk.getPosition();

      if (disk.isTurningClockwise) {
        position += 1;
      }
      else if (disk.isTurningCounterclockwise) {
        position -= 1;
      }
      else {
        continue;
      }

      if (position < 0) {
        position += this.viewConfig.MAX_POSITION;
      }
      else {
        position %= this.viewConfig.MAX_POSITION;
      }

      this._disksActionCreator.sendDiskUpdate(diskId, {
        position: position
      });
    }
  }
}


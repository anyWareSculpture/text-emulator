/*
  Game event               Sound                      Logic

  Enter alone mode         Alone_Mode/Pulse_amb_loop  FIXME
  Handshake                Alone_Mode/Hand_Shake_01   changes.handshakes (Set of bool)

Mole:
  Panel activated          Game_01/G01_LED_XX
  Active panel touched     Game_01/G01_Success_01
  Non-active panel touched Game_01/G01_Negative_01

Disk:

Simon:
  Panel activated during pattern animation
                           Game_03/G03_LED_XX
  Correct panel touched
                           Game_03/G03_LED_XX
  Wrong panel touched
                           Game_03/G03_Negative_01
  Won level (after short delay)
                           Game_03/G03_Success_01
  Won all levels (after short delay)
                           Game_03/G03_Light_Show_01

*/

const _ = require('lodash');

import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import GAMES from 'anyware/lib/game-logic/constants/games';
import {Sound, VCFSound} from './audio-api';

export default class AudioView {
  constructor(store, config, dispatcher) {
    this.store = store;
    this.config = config;
    this.store.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  load(callback) {
    // Maps logical sound identifiers to filenames. We'll load these sounds next.
    this.sounds = {
      alone: {
        ambient: new VCFSound({url: 'sounds/Alone_Mode/Pulse_Amb_Loop.wav'}),
        handshake: 'sounds/Alone_Mode/Hand_Shake_01.wav'
      },
      mole: {
        success: 'sounds/Game_01/G01_Success_01.wav',
        failure: 'sounds/Game_01/G01_Negative_01.wav',
        panels: [0,1,2].map(stripId => _.range(10).map(panelId => `sounds/Game_01/G01_LED_${("0"+(stripId*10+panelId+1)).slice(-2)}.wav`))
      },
//      disk: {
//      },
      simon: {
        panels: [0,1,2].map(stripId => _.range(10).map(panelId => `sounds/Game_03/G03_LED_${("0"+(stripId*10+panelId+1)).slice(-2)}.wav`)),
        success: 'sounds/Game_03/G03_Success_01.wav',
        failure: 'sounds/Game_03/G03_Negative_01.wav',
        show: 'sounds/Game_03/G03_Light_Show_01.wav'
      }
    };

    // Traverse this.sounds and replace the filenames with valid sound objects.
    this._promises = [];
    this._traverse(this.sounds);

    // _loadSound() will create promises. We call the callback once all promises resolve
    console.log(`${this._promises.length} promises`);
    Promise.all(this._promises)
      .then(callback.bind(null, null))
      .catch(callback.bind(null));
    
    return;

    // FIXME: Somehow wait until all sounds have loaded before attempting to play them
//    const ambientLoop = new VCFSound({url:'sounds/Alone_Mode/Pulse_Amb_Loop.wav', loop: true, fadeIn: 3});
//    this.sounds.alone.handshake = new Sound({url:'sounds/Alone_Mode/Hand_Shake_01.wav'});

    this._loadSound({url:'sounds/Alone_Mode/Hand_Shake_01.wav'});

    const molesounds = [];
    for (let j=0;j<3;j++) {
      const strip = [];
      for (let i=0;i<10;i++) {
        const soundid = j*10+i;
        strip.push(new Sound({url: `sounds/Game_01/G01_LED_${("0"+(soundid+1)).slice(-2)}.wav`}));
      }
      molesounds.push(strip);
    }
    this.sounds.mole.panels = molesounds;

    this.sounds.mole.success = new Sound({url:'sounds/Game_01/G01_Success_01.wav'});
    this.sounds.mole.failure = new Sound({url:'sounds/Game_01/G01_Negative_01.wav'});

    const simonsounds = [];
    for (let j=0;j<3;j++) {
      const strip = [];
      for (let i=0;i<10;i++) {
        const soundid = j*10+i;
        strip.push(new Sound({url: `sounds/Game_03/G03_LED_${("0"+(soundid+1)).slice(-2)}.wav`}));
      }
      simonsounds.push(strip);
    }
    this.sounds.simon.panels = simonsounds;

    this.sounds.simon.success = new Sound({url: 'sounds/Game_03/G03_Success_01.wav'});
    this.sounds.simon.failure = new Sound({url: 'sounds/Game_03/G03_Negative_01.wav'});
    this.sounds.simon.show = new Sound({url: 'sounds/Game_03/G03_Light_Show_01.wav'});

  }

  _traverse(node) {
    for (let key in node) {
      const value = node[key];
      let sound;
      if (typeof value === 'string') sound = node[key] = new Sound({url: value});
      else if (value instanceof Sound) sound = value;
      if (sound) this._loadSound(sound);
      else this._traverse(value);
    }
  }

  // Returns a promise to provide a comple, usable sound.
  _loadSound(sound) {
    const promise = sound.load();
    this._promises.push(promise);
    return promise;
  }

  _handleChanges(changes) {
    if (this._animating) {
      return;
    }

    if (changes.currentGame === GAMES.HANDSHAKE) this.sounds.alone.ambient.play();

    this._handleHandshakeChanges(changes);
    this._handleStatusChanges(changes);
    this._handleLightChanges(changes);
  }

  _handleHandshakeChanges(changes) {
    if (changes.handshakes) {
      // Did someone shake my hand?
      if (changes.handshakes[this.config.username]) {
        this.sounds.alone.ambient.stop();
        this.sounds.alone.handshake.play();
      }
    }
  }

  _handleStatusChanges(changes) {
    if (changes.status) {
      let statusSounds;

      if (this.store.isPlayingMoleGame) {
        statusSounds = {
          [SculptureStore.STATUS_SUCCESS]: this.sounds.mole.success,
          [SculptureStore.STATUS_FAILURE]: this.sounds.mole.failure
        };
      }
      if (this.store.isPlayingSimonGame) {
        statusSounds = {
          [SculptureStore.STATUS_SUCCESS]: this.sounds.simon.success,
          [SculptureStore.STATUS_FAILURE]: this.sounds.simon.failure
        };
      }

      const statusSound = statusSounds[changes.status];
      if (statusSound) statusSound.play();
    }
  }

  _handleLightChanges(changes) {
    const lightChanges = changes.lights;
    if (!lightChanges || !this.store.isReady) {
      return;
    }
    
    if (this.store.isPlayingMoleGame) {
      const lightArray = this.lightArray;
      for (let stripId of Object.keys(lightChanges)) {
        const panels = lightChanges[stripId].panels;
        for (let panelId of Object.keys(panels)) {
          const panelChanges = panels[panelId];
          if (panelChanges.intensity > 90) {
            this.sounds.mole.panels[stripId][panelId].play();
          }
          if (panelChanges.hasOwnProperty("active")) {
            if (panelChanges.active) {
              const molegame = this.store.currentGameLogic;
              const moledata = this.store.data.get('mole');
              const currentTarget = molegame.getTargetPanels(moledata.get('targetIndex'));

              // FIXME: The problem here is that currentTarget gets removed by the MoleGameLogic before this event reaches us. We may have to transport this info in the changes object as that's currently not done.

              if (currentTarget.has(stripId, panelId)) {
                this.sounds.mole.success.play();
              }
              else {
                this.sounds.mole.failure.play();
//                console.log(`Play ${stripId}:${panelId}`);
//                this.panelsounds[stripId][panelId].play();
              }
            }
          }
          
        }
      }
    }
    if (this.store.isPlayingSimonGame) {
      const lightArray = this.lightArray;
      for (let stripId of Object.keys(lightChanges)) {
        const panels = lightChanges[stripId].panels;
        for (let panelId of Object.keys(panels)) {
          const panelChanges = panels[panelId];
          if (panelChanges.active || panelChanges.intensity > 90) {
            this.sounds.simon.panels[stripId][panelId].play();
          }
        }
      }      
    }
  }

  get lightArray() {
    return this.store.data.get('lights');
  }
}

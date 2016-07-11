//const Config = require('./config');
//const {Dispatcher} = require('flux');
//const SculptureStore = require('anyware/lib/game-logic/sculpture-store');
require('./node-audio');
if (global.NodeAudioContext) console.log("AAA");
import AudioView from 'anyware/lib/views/audio-view';

//const config = new Config();
//const dispatcher = new Dispatcher();
//const sculpture = new SculptureStore(dispatcher, config);
//const audioView = new AudioView(sculpture, config, dispatcher);
const audioView = new AudioView();
audioView.load(err => {
  if (err) return console.log(`Error: ${err}`);
  console.log('Loaded');
});

console.log('Start');

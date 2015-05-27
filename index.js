const blessed = require('blessed');

const InputBox = require('./input-box');

const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true
});

const inputBox = new InputBox({
  parent: screen,
  top: 0,
  left: 0,
  width: '50%',
  height: '100%'
});

// Quit on Escape, q, or Control-C.
screen.key(['C-c'], function(ch, key) {
  return process.exit(0);
});

screen.title = 'anyWare Emulator';

// Render the screen.
screen.render();

const {MoleGameLogic} = require('@anyware/game-logic');

export default class MoleGameAnimations {
  static playAnimation(animation, view, completeCallback) {
    const animationFunctions = {
      [MoleGameLogic.ANIMATION_SUCCESS]: MoleGameAnimations.playSuccessAnimation
    };

    const animationFunction = animationFunctions[animation];
    if (animationFunction) {
      animationFunction(view, completeCallback);
    }
    else if (completeCallback) {
      // Cannot be called in the current execution frame as it may trigger an action and the dispatcher can't handle two of those at once
      setTimeout(() => {
        completeCallback();
      }, 0);
    }
  }

  static playSuccessAnimation(view, completeCallback) {
    const frames = [
      {align: "center", line: 0},
      {align: "left", line: 1},
      {align: "right", line: 2},
      {align: "left", line: 2},
      {align: "right", line: 1},
      {align: "left", line: 0},
      {align: "right", line: 0},
      {align: "center", line: 2},
      {align: "center", line: 1}
    ];
    
    const playFrame = (frameIndex) => {
      const lines = ['', '', ''];
      const {align, line} = frames[frameIndex];
      lines[line] = `{${align}}{green-fg}{bold}SUCCESS!!{/bold}{/green-fg}{/${align}}`;
      view.setBodyContent(lines.join('\n'));
      view.screen.render();
      
      if (frameIndex < frames.length - 1) {
        setTimeout(() => playFrame(frameIndex + 1), 500);
      }
      else {
        completeCallback();
      }
    };
    playFrame(0);
  }
}

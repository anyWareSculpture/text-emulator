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
      ["split", "center", "split"],
      ["center", "split", "center"]
    ];
    
    const playFrame = (frameIndex) => {
      const lines = [];
      const lineFormats = frames[frameIndex];
      
      const word = "{green-fg}{bold}SUCCESS!!{/bold}{/green-fg}";
      for (let lineFormat of lineFormats) {
        let line;
        if (lineFormat === "split") {
          line = `${word}{|}${word}`;
        }
        else if (lineFormat === "center") {
          line = `{center}${word}{/center}`;
        }
        lines.push(line);
      }

      view.setBodyContent(lines.join('\n'));
      view.screen.render();
      
      if (frameIndex < frames.length - 1) {
        setTimeout(() => playFrame(frameIndex + 1), 1000);
      }
      else {
        completeCallback();
      }
    };
    playFrame(0);
  }
}

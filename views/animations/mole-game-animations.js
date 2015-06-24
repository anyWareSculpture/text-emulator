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
    view.setBodyContent("{green-fg}{center}{blink}SUCCESS!!{/blink}{/center}{/green-fg}");
    
    setTimeout(() => {
      completeCallback();
    }, 2000);
  }
}

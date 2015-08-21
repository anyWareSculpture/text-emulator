export default class PanelAnimations {
  static playSuccessAnimation(view, completeCallback) {
    const frames = [
      ["split", "center", "split"],
      ["center", "split", "center"],
      ["split", "center", "split"],
      ["center", "split", "center"],
      ["split", "center", "split"],
      ["center", "split", "center"],
      ["split", "center", "split"],
      ["center", "split", "center"],
      ["split", "center", "split"],
      ["center", "split", "center"]
    ];

    PanelAnimations.playAnimation("{green-fg}{bold}SUCCESS!!{/bold}{/green-fg}", frames, view, completeCallback);
  }

  static playFailureAnimation(view, completeCallback) {
    const frames = [
      ["split", "split", "split"],
      ["center", "center", "center"],
      ["split", "center", "split"],
      ["center", "split", "center"],
      ["center", "center", "center"],
      ["split", "split", "split"],
    ];

    PanelAnimations.playAnimation("{red-fg}{bold}FAILURE!!{/bold}{/red-fg}", frames, view, completeCallback);
  }
    
  static playAnimation(word, frames, view, completeCallback) {
    const playFrame = (frameIndex) => {
      const lines = [];
      const lineFormats = frames[frameIndex];
      
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
      
      let nextFunction;
      if (frameIndex < frames.length - 1) {
        nextFunction = () => playFrame(frameIndex + 1);
      }
      else {
        nextFunction = completeCallback;
      }
      setTimeout(nextFunction, 500);
    };
    setTimeout(() => playFrame(0), 500);
  }
}


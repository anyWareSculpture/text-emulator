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
      
      let nextFunction;
      if (frameIndex < frames.length - 1) {
        nextFunction = () => playFrame(frameIndex + 1);
      }
      else {
        nextFunction = completeCallback;
      }
      setTimeout(nextFunction, 500);
    };
    playFrame(0);
  }
}


const COMMAND_EXIT = 'exit';

export default class CommandInteractionHandler {
  constructor(outputConsole) {
    this.outputConsole = outputConsole;
  }

  processCommand(command) {
    if (command.toLowerCase() === COMMAND_EXIT) {
      process.exit(0);
    }

    this.outputConsole.log(command);
  }
}

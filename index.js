require('source-map-support').install();

const Config = require('./config');
const EmulatorApp = require('./application');

let app;
let errorsOccurred = false;
process.on('uncaughtException', function(err) {
  errorsOccurred = true;

  const currentDate = new Date();
  const currentDay = currentDate.toDateString();
  const currentTime = currentDate.toTimeString();

  let stack = "";
  try {
    stack = err.stack;
  }
  catch (error) {
    stack = err.toString();
  }

  require('fs').appendFileSync('error.log', `[${currentDay} ${currentTime}] ${stack}\n`);

  if (app) {
    // Not a best practice
    app._error(err);
  }
});

process.on('exit', function() {
  if (errorsOccurred) {
    console.error("There were errors. See error.log for more information");
  }
});

const config = new Config();
app = new EmulatorApp(config);

const connectionOptions = Object.assign({}, config.CLIENT_CONNECTION_OPTIONS.default);
if (process.argv.length === 4) {
  console.log("Using authentication information provided by command arguments");
  config.username = process.argv[2];
  connectionOptions.username = process.argv[2];
  connectionOptions.password = process.argv[3];
}

app.connectAndSetup(connectionOptions);

app.render();

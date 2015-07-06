let app;
process.on('uncaughtException', function(err) {
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

const EmulatorApp = require('./application');

const DEFAULT_CLIENT_CONNECTION_OPTIONS = {
  protocol: "ws",
  username: "anyware",
  password: "anyware",
  host: "connect.shiftr.io:1884"
};

app = new EmulatorApp();

const connectionOptions = Object.assign({}, DEFAULT_CLIENT_CONNECTION_OPTIONS);
if (process.argv.length === 4) {
  console.log("Using authentication information provided by command arguments");
  connectionOptions.username = process.argv[2];
  connectionOptions.password = process.argv[3];
}

app.connectAndSetup(connectionOptions);

app.render();

process.on('uncaughtException', function(err) {
  const currentDate = new Date();
  const currentDay = currentDate.toDateString();
  const currentTime = currentDate.toTimeString();
  require('fs').appendFileSync('error.log', `[${currentDay} ${currentTime}] ${err.stack}\n`);
});

const Emulator = require('./application');

const DEFAULT_CLIENT_CONNECTION_OPTIONS = {
  protocol: "ws",
  username: "anyware",
  password: "anyware",
  host: "connect.shiftr.io:1884"
};

const app = new Emulator();

const connectionOptions = Object.assign({}, DEFAULT_CLIENT_CONNECTION_OPTIONS);
if (process.argv.length === 4) {
  console.log("Using authentication information provided by command arguments");
  connectionOptions.username = process.argv[2];
  connectionOptions.password = process.argv[3];
}
app.connectAndSetup(connectionOptions);

app.beginLoop();

app.render();


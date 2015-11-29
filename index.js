require('source-map-support').install();

const fs = require('fs');

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

  fs.appendFileSync('error.log', `[${currentDay} ${currentTime}] ${stack}\n`);

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
global.debug = app.screen.debug.bind(app.screen);

const connectionOptions = Object.assign({}, config.CLIENT_CONNECTION_OPTIONS.default);
if (process.argv.length > 2) {
  const args = process.argv.slice(2);
  
  parseArgs(args, connectionOptions);
  // Hack because shiftr doesn't support multiple same usernames across
  // namespaces and we need the usernames to be 'sculpture0', etc.
  config.username = connectionOptions.username.split('-')[0];
}

app.connectAndSetup(connectionOptions);

app.render();

function parseArgs(args, options) {
  // Expects at least 1 argument in args
  // Allows for:
  // * Password from environment and username:
  //   <env alias> <username>
  // * Any username from environment:
  //   <env alias>
  // * Host from environment:
  //   <env alias> <username> <password>
  // * Just credentials on default host:
  //   - <username> <password>
  // * Complete credentials:
  //   <host> <username> <password>

  let credentials;
  try {
    credentials = JSON.parse(fs.readFileSync('.credentials'));
  }
  catch (e) {
    console.warn("Warning: No parsable .credentials file found, trying reasonable defaults");
    credentials = {};
  }


  let [env, username, password] = args;
  let host = options.host;
  if (env !== '-') {
    console.log("Using authentication information provided by .credentials");
    if (credentials.hasOwnProperty(env)) {
      const envInfo = credentials[env];
      host = envInfo.host;
      username = username || Object.keys(envInfo.users)[0];
      password = password || envInfo.users[username];
    }
    else {
      console.log("Assuming given environment argument is host");
      host = env;
    }
  }
  else {
    console.log("Using authentication information provided by command arguments");
  }

  if (username && password) {
    options.host = host;
    options.username = username;
    options.password = password;
  }
  else {
    console.error("Not enough information. Continuing with defaults.");
  }
}

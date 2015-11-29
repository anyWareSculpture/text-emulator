const fs = require('fs');

const prompt = require('prompt');
const colors = require('colors');

prompt.message = '';
prompt.delimiter = '';
prompt.colors = false;
prompt.start();

console.log("Welcome!".yellow);
console.log("This script generates a .credentials file for all of your environments.".yellow);
console.log("Note: This will overwrite any existing .credentials file".yellow);
console.log("Press Ctrl+C to cancel and quit at any point".red);
console.log("".yellow);

generateCredentialsContent().then((content) => {
  if (!Object.keys(content).length) {
    console.log('No content to write...aborting.'.red);
    return Promise.resolve();
  }

  return promptValue('\nOutput Filename: ', '.credentials').then((filename) => {
    return new Promise(function(resolve, reject) {
      const stringContents = JSON.stringify(content, null, 2);
      fs.writeFile(filename, stringContents, function(err) {
        if (err) {
          return reject(err);
        }
        console.log('\n');
        console.log(stringContents.blue.bold);
        console.log(`Successfully written credentials to "${filename}"`.green);
        resolve();
      });
    });
  });
}).catch((err) => {
  console.error("\nAn error occurred. Its contents are below.".red);
  console.error(err.stack || err.toString());
});

function generateCredentialsContent() {
  return new Promise((resolve, reject) => {
    const content = {};
    const appendEnvironmentSection = (environmentSection) => {
      if (!Object.keys(environmentSection).length) {
        return Promise.resolve(content);
      }
      Object.assign(content, environmentSection);

      const defaultHost = environmentSection[Object.keys(environmentSection)[0]].host;
      return getEnvironmentSection(defaultHost).then(appendEnvironmentSection);
    };

    getEnvironmentSection().then(appendEnvironmentSection).then(resolve).catch(reject);
  });
}

function getEnvironmentSection(defaultHost='') {
  console.log("\nEnter 'q' when you are done.");
  return promptValues([
    'environment host: ', 'alias: '
  ], [
    defaultHost, 'dev'
  ]).then(([host, env]) => {
    if (!env || !host) {
      return Promise.resolve({});
    }

    console.log("\nEnter 'q' when you are done.");
    return getEnvironmentUsers().then((users) => {
      return Promise.resolve({
        [env]: {
          host: host,
          users: users
        }
      });
    });
  });
}

function getEnvironmentUsers() {
  return new Promise((resolve, reject) => {
    let index = 0;
    const content = {};
    const append = (creds) => {
      if (!Object.keys(creds).length) {
        return Promise.resolve(content);
      }
      const {username, password} = creds;
      content[username] = password;

      return getUser(++index).then(append);
    };

    getUser(++index).then(append).then(resolve).catch(reject);
  });
}

function getUser(number) {
  console.log(`Credentials for user ${number}:`);
  return promptValues(['username / password: ']).then(([creds]) => {
    const [username, password] = creds.split('/').map((s) => s.trim());
    if (!username || !password) {
      return Promise.resolve({});
    }

    return Promise.resolve({
      username: username,
      password: password
    });
  });
}

function promptValues(descriptions, defaultValues='') {
  const accumulator = [];
  const promptDescription = (index) => {
    const defaultValue = defaultValues instanceof Array ? defaultValues[index] : defaultValues;
    return promptValue(descriptions[index], defaultValue).then((value) => {
      if (value.trim() === 'q') {
        // Discard all input and return empty
        return Array(descriptions.length).join(".").split(".");
      }

      accumulator.push(value);

      index++;
      if (index >= descriptions.length) {
        return Promise.resolve(accumulator);
      }
      return promptDescription(index);
    });
  };

  return promptDescription(0);
}

function promptValue(description, defaultValue='') {
  return new Promise((resolve, reject) => {
    prompt.get({
      properties: {
        value: {
          description: description.cyan,
          default: defaultValue,
          required: true
        }
      }
    }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result.value);
    });
  });
}

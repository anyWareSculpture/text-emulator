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
      return getEnvironmentSection().then(appendEnvironmentSection);
    };

    getEnvironmentSection().then(appendEnvironmentSection).then(resolve).catch(reject);
  });
}

function getEnvironmentSection() {
  console.log("\nEnter 'q' when you are done.");
  return promptValues(['environment name: ', 'host: ']).then(([env, host]) => {
    if (env === 'q' || host === 'q') {
      return Promise.resolve({});
    }

    const section = {
      [env]: {
        host: host,
        users: {}
      }
    };

    return Promise.resolve(section);
  });
}

function promptValues(descriptions, defaultValue='') {
  const accumulator = [];
  const promptDescription = (index) => {
    return promptValue(descriptions[index], defaultValue).then((value) => {
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
          default: defaultValue
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

const api = new Urbit('', '', 'market');
api.ship = window.ship;
window.api = api;

var subscription = null;
var errorCount = 0;

api.onError = (e) => {
  errorCount++;
  subcription = 'disconnected';
  console.log(subscription);
  try {
    api.reset();
  } catch (error) {
    console.error(`Retrying connection, attempt #${errorCount}`);
    setTimeout(api.onError, Math.pow(2, errorCount) * 750);
  }
}

api.onRetry = () => {
  subscription = 'reconnecting';
  console.log(subscription);
}

api.onOpen = () => {
  subscription = 'connected';
  errorCount = 0;
  console.log(subscription);
}

const mailerScry = (path) => {
  return api.scry({app: 'mailer', path: path});
}

const pipeScry = (path) => {
  return api.scry({app: 'pipe', path: path});
}

const mailerPoke = (json) => {
  return api.poke({
    app: 'mailer',
    mark: 'mailer-action',
    json
  });
}

const pipePoke = (json) => {
  return api.poke({
    app: 'pipe',
    mark: 'pipe-action',
    json
  });
}

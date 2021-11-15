
window.store = {
  hookLists: {},
  state: {
    seller: {
      market: {},
      nmi: {}
    }
  }
};

const sellerReducer = (state, update) => {
  if (typeof update.data !== 'object') { return; }
  let key = Object.keys(update.data)[0];
  let val  = update.data[key];
  switch (update.app) {
  case 'naive-nmi':
    switch (key) {
    case 'set-site':
      state.nmi.site = val;
      break;
    case 'set-api-key':
      state.nmi.apiKey = val;
      break;
    }
    return state;
    break;
  case 'naive-market':
    switch (key) {
    case 'add-star-config':
      if (!('stars' in state.market)) {
        state.market.stars = {};
      }
      state.market.stars[val.who] = val.config;
      break;
    case 'del-star-config':
      if (!('stars' in state.market)) {
        state.market.stars = {};
      }
      delete state.market.stars[val];
      break;
    case 'set-price':
      state.market.price = val;
      break;
    case 'set-referrals':
      state.market.referrals = val;
      break;
    }
    return state;
    break;
  default:
    return state;
  }
};


const addHookToStore = (name = '', hook = (state) => {}) => {
  if (name in store.hookLists) {
    store.hookLists[name].push(hook);
  } else {
    store.hookLists[name] = [hook];
  }
};

window.reduceStore = (update = null) => {
  if (!update || typeof update !== 'object') {
    return;
  }

  let newState = JSON.parse(JSON.stringify(store.state));
  newState.seller = sellerReducer(newState.seller, update);

  Object.keys(store.hookLists).forEach((name) => {
    let hooks = store.hookLists[name];
    hooks.forEach((hook) => {
      if (JSON.stringify(store.state[name]) === JSON.stringify(newState[name])) {
        return;
      } else {
        hook(newState[name]);
      }
    });
  });

  window.store.state = newState;
};

setTimeout(() => {
  api.subscribe({
    app: 'naive-market',
    path: '/configuration',
    event: (json) => {
      window.reduceStore({ app: 'naive-market', data: json });
    },
    quit: () => {},
    err: () => {}
  });

  api.subscribe({
    app: 'naive-nmi',
    path: '/configuration',
    event: (json) => {
      window.reduceStore({ app: 'naive-nmi', data: json });
    },
    quit: () => {},
    err: () => {}
  });
}, 200);


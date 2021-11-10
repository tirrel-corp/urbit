
window.store = {
  hookLists: {},
  state: {
    seller: {
      isSetup: false
    }
  }
};

const sellerReducer = (state, update) => {
  console.log(update);
  state.isSetup = !state.isSetup;
  return state;
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

  let newState = {};
  newState.seller = sellerReducer(store.state.seller, update);

  Object.keys(store.hookLists).forEach((name) => {
    let hooks = store.hookLists[name];
    hooks.forEach((hook) => {
      console.log(hooks);
      console.log(store.state[name], newState[name]);
      if (JSON.stringify(store.state[name]) === JSON.stringify(newState[name])) {
        return;
      } else {
        hook(newState[name]);
      }
    });
  });

  window.store.state = newState;
};

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
  path: '/updates',
  event: (json) => {
    window.reduceStore({ app: 'naive-nmi', data: json });
  },
  quit: () => {},
  err: () => {}
});



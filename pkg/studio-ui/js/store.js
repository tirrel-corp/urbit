
window.store = {
  seller: {
    naiveMarket: null,
    naiveNMI: null
  }
};

let naiveMarketReducer = (store, update) => {
  return store;
};

let naiveNMIReducer = (store, update) => {
  return store;
};

window.reduceStore = (update = null) => {
  if (!update || typeof update !== 'object') {
    return;
  }

  console.log(update);
  window.store.seller = naiveMarketReducer(window.store.seller, update);
  window.store.seller = naiveNMIReducer(window.store.seller, update);
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



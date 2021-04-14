import { InitialReducer } from './reducers/initial';
import { UpdateReducer } from './reducers/update';

class Store {
  constructor() {
    this.state = {
      providerPerms: {},
      provider: true,
      hasWallet: true,
      wallet: {},
      psbt: '',
    };

    this.initialReducer = new InitialReducer();
    this.updateReducer = new UpdateReducer();
    this.setState = () => { };
  }

  setStateHandler(setState) {
    this.setState = setState;
  }

  handleEvent(data) {
    let json = data.data;

    console.log(json);
    this.initialReducer.reduce(json, this.state);
    this.updateReducer.reduce(json, this.state);

    this.setState(this.state);
  }
}

export let store = new Store();
window.store = store;
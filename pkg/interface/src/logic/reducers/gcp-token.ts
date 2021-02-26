import _ from 'lodash';
import {StoreState} from '../store/type';
import {GcpToken} from '../../types/gcp-state';

type GcpState = Pick<StoreState, 'gcp'>;

export default class GcpReducer<S extends GcpState>{
  reduce(json: Cage, state: S) {
    let data = json['gcp-token'];
    if (data) {
      this.setToken(data, state);
    }
  }

  setToken(data: any, state: S) {
    if (this.isToken(data)) {
      state.gcp.token = data;
    }
  }

  isToken(token: any): token is GcpToken {
    return (typeof(token.accessKey) === 'string' &&
            typeof(token.expiresIn) === 'number');
  }
}

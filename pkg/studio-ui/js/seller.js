//== Inner Navigation

const getStartedFlow = document.querySelector("#sell-get-started-flow");
const mainFlow = document.querySelector("#sell-main-flow");

const sellStatusPage = document.querySelector("#sell-status-inner-page");
const sellSettingsPage = document.querySelector("#sell-settings-inner-page");

const startZeroPage = document.querySelector("#sell-start-0");
const startOnePage = document.querySelector("#sell-start-1");

const getStartedBtn = document.querySelector("#get-started-sell-btn");
const sellStatusBtn = document.querySelector("#sell-status-btn");
const sellSettingsBtn = document.querySelector("#sell-settings-btn");


//== Outer Display Logic

const sellFlowSelector = (state) => {
  if (
    !!state.nmi.site &&
    !!state.nmi.apiKey &&
    !!state.market.price &&
    !!state.market.stars &&
    Object.keys(state.market.stars).length > 0
  ) {
    getStartedFlow.style = 'display:none;';
    mainFlow.style = '';

    // TODO: if we are in setup mode, determine *where* in setup mode we are
  } else {
    getStartedFlow.style = '';
    mainFlow.style = 'display:none;';
  }
};

sellFlowSelector(store.state.seller);


//==  Main flow

const innerButtons = {
  sell: {
    status: sellStatusBtn,
    settings: sellSettingsBtn
  },
  start: {}
};

const innerPages = {
  sell: {
    status: sellStatusPage,
    settings: sellSettingsPage
  },
  start: {
    zero: startZeroPage,
    one: startOnePage
  }
};

const showInnerPage = (outerKey = null, key = null) => {
  if (!outerKey || !key) { return; }
  Object.keys(innerPages[outerKey]).forEach((k) => {
    if (k === key) {

      if (innerButtons[outerKey][k]) {
        innerButtons[outerKey][k].style = 'color: #000 !important;'
      }

      innerPages[outerKey][k].style = 'height: calc(100% - 2rem);';
    } else {
      innerPages[outerKey][k].style = 'display: none;';

      if (innerButtons[outerKey][k]) {
        innerButtons[outerKey][k].style = '';
      }
    }
  });
};

sellStatusBtn.onclick = (e) => {
  window.showPage('sell');
  showInnerPage('sell', 'status');
};

sellSettingsBtn.onclick = (e) => {
  window.showPage('sell');
  showInnerPage('sell', 'settings');
};


if (location.hash === '#sell-status') {
  showInnerPage('sell', 'status');
} else if (location.hash === '#sell-settings') {
  showInnerPage('sell', 'settings');
} else {
  showInnerPage('sell', 'status');
}


//== Get Started Flow

getStartedBtn.onclick = () => {
  //  TODO: move forward in tutorial flow
  showInnerPage('start', 'one');
};

const deSig = (txt = '') => {
  if (!txt || txt.length < 1) { return txt; }
  if (txt[0] === '~') {
    return txt.slice(1);
  } else {
    return txt;
  }
};

const stripClass = (classes = '', name = '') => {
  return classes.split(' ').filter((c) => {
    return !(
      c === name
    );
  }).join(' ');
};


const GSAddStarNameInp = document.querySelector("#get-started-add-star-name-input");
const GSAddStarPrvInp  = document.querySelector("#get-started-add-star-prv-input");
const GSAddStarProxyInp = document.querySelector("#get-started-add-star-proxy-input");
const GSAddStarBtn = document.querySelector("#get-started-add-star-config-btn");


let isGSStarFormValid = [false, false, false];
let GSStarFormButtonValid = () => {
  if (isGSStarFormValid[0] && isGSStarFormValid[1] && isGSStarFormValid[2]) {
    GSAddStarBtn.disabled = false;
    GSAddStarBtn.className =
      stripClass(GSAddStarBtn.className, 'bg-gray');
    GSAddStarBtn.className =
      stripClass(GSAddStarBtn.className, 'hover-bg-gray');
  } else {
    GSAddStarBtn.disabled = true;
    GSAddStarBtn.className += ' bg-gray hover-bg-gray';
  }
};

GSAddStarNameInp.oninput = () => {
  const isValidPatp = urbitOb.isValidPatp;

  if (isValidPatp('~' + deSig(GSAddStarNameInp.value))) {
    GSAddStarNameInp.className =
      stripClass(GSAddStarNameInp.className, 'b--dark-red');
    isGSStarFormValid[0] = true;
  } else {
    GSAddStarNameInp.className += ' b--dark-red';
  }

  GSStarFormButtonValid();
};

GSAddStarPrvInp.oninput = () => {
  const isValidPatq = urbitOb.isValidPatq;

  if (isValidPatq('~' + deSig(GSAddStarPrvInp.value))) {
    GSAddStarPrvInp.className =
      stripClass(GSAddStarPrvInp.className, 'b--dark-red');
    isGSStarFormValid[1] = true;
  } else {
    GSAddStarPrvInp.className += ' b--dark-red';
  }

  GSStarFormButtonValid();
};

GSAddStarProxyInp.onchange = () => {
  if (!!GSAddStarProxyInp.value && GSAddStarProxyInp.value.length > 0) {
    GSAddStarProxyInp.className =
      stripClass(GSAddStarProxyInp.className, 'b--dark-red')
    isGSStarFormValid[2] = true;
  } else {
    GSAddStarProxyInp.className += ' b--dark-red';
  }

  GSStarFormButtonValid();
};

GSAddStarBtn.onclick = () => {
  if (GSAddStarBtn.disabled) { return; }
  console.log('ayyy');
};

//== Reactive Logic
addHookToStore(
  'seller',
  (state) => {
    sellFlowSelector(state);
    console.log('state changed', state);
  }
);


//== Naive Market Settings ====================================================

const addStarNameInp = document.querySelector("#add-star-name-input");
const addStarPrvInp  = document.querySelector("#add-star-prv-input");
const addStarProxyInp = document.querySelector("#add-star-proxy-input");

const delStarInp = document.querySelector("#del-star-config-input");
const planetPriceInp = document.querySelector("#planet-price-input");

const spawnShipsFromInp = document.querySelector("#spawn-ships-from-input");
const spawnShipsNumInp = document.querySelector("#spawn-ships-num-input");
//const setReferralsInp = document.querySelector("#referral-input");

const addStarBtn = document.querySelector("#add-star-config-btn");
const delStarBtn = document.querySelector("#del-star-config-btn");
const planetPriceBtn = document.querySelector("#planet-price-btn");
const spawnShipsBtn = document.querySelector("#spawn-ships-btn");
//const setReferralsBtn = document.querySelector("#referral-btn");


addStarBtn.onclick = () => {
  naiveMarketPoke({
    'add-star-config': {
      ship: addStarNameInp.value,
      config: {
        prv: addStarPrvInp.value,
        proxy: addStarProxyInp.value
      }
    }
  });
}

let configs = [];

naiveMarketScry('/star-configs').then((res) => {
  console.log('star-configs', res);
  if (res !== null) {
    configs = res;

    configs.forEach((c) => {
      console.log(configs[c]);
      let option = document.createElement('option');
      option.value = c;
      option.textContent = c;

      delStarInp.appendChild(option);

      let option2 = document.createElement('option');
      option2.value = c;
      option2.textContent = c;

      spawnShipsFromInp.appendChild(option2);
    });
  }
});

delStarBtn.onclick = () => {
  naiveMarketPoke({
    'del-star-config': delStarInp.value
  });
}

planetPriceBtn.onclick = () => {
  naiveMarketPoke({
    'set-price': {
      amount: parseInt(planetPriceInp.value, 10),
      currency: 'USD'
    }
  });
}

spawnShipsBtn.onclick = () => {
  naiveMarketPoke({
    'spawn-ships': {
      ship: spawnShipsFromInp.value,
      sel: parseInt(spawnShipsNumInp.value, 10)
    }
  });
}

/*setReferralsBtn.onclick = () => {
  naiveMarketPoke();
}*/

//== Naive NMI Settings =====================================================

const domainNameInp = document.querySelector("#domain-name-input");
const saleAPIInp = document.querySelector("#sale-api-input");

const domainNameBtn  = document.querySelector("#domain-name-button");
const saleAPIBtn = document.querySelector("#sale-api-button");

domainNameBtn.onclick = () => {
  naiveNMIPoke({ "set-site": {
    host: domainNameInp.value,
    suffix: null
  }});
}

saleAPIBtn.onclick = () => {
  naiveNMIPoke({ "set-site": saleAPIInp.value });
}

naiveNMIScry('/site').then((res) => {
  if (res !== null) {
    domainNameInp.value = res;
  }
});

naiveNMIScry('/api-key').then((res) => {
  if (res !== null) {
    saleAPIInp.value = res;
  }
});


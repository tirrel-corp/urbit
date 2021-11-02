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


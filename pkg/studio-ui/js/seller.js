//== Naive Market Settings ====================================================

const addStarNameInp = document.querySelector("#add-star-name-input");
const addStarPrvInp  = document.querySelector("#add-star-prv-input");
const addStarProxyInp = document.querySelector("#add-star-proxy-input");

const delStarInp = document.querySelector("#del-star-config-input");
const setPlanetPriceInp = document.querySelector("#planet-price-input");
const setReferralsInp = document.querySelector("#referral-input");
const spawnShipsInp = document.querySelector("#spawn-ships-input");

const addStarBtn = document.querySelector("#add-star-config-btn");
const delStarBtn = document.querySelector("#del-star-config-btn");
const setPlanetPriceBtn = document.querySelector("#planet-price-btn");
const setReferralsBtn = document.querySelector("#referral-btn");
const spawnShipsBtn = document.querySelector("#spawn-ships-btn");

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

delStarBtn.onclick = () => {
  naiveMarketPoke();
}

setPlanetPriceBtn.onclick = () => {
  naiveMarketPoke();
}

setReferralsBtn.onclick = () => {
  naiveMarketPoke();
}

spawnShipsBtn.onclick = () => {
  naiveMarketPoke();
}

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


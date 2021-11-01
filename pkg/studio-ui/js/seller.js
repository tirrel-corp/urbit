//== Planet Sale Settings =====================================================

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


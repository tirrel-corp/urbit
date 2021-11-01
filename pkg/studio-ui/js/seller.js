//== Planet Sale Settings =====================================================

const domainNameInp = document.querySelector("#domain-name-input");
const domainNameBtn  = document.querySelector("#domain-name-button");

domainNameBtn.onclick = () => {
  naiveNMIPoke({ "set-site": {
    host: domainNameInp.value,
    suffix: null
  }});
}

naiveNMIScry('/site').then((res) => {
  console.log('site', res);
  if (res !== null) {
    domainNameInp.value = res;
  }
});



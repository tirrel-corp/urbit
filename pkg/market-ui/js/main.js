//== Top Level Navigation ======================================================

const planetSaleBtn = document.querySelector("#planet-sale-btn");
const staticSiteBtn = document.querySelector("#static-site-btn");
const mailingListBtn = document.querySelector("#mailing-list-btn");

const landingPage = document.querySelector("#landing-page");
const planetSalePage = document.querySelector("#planet-sale-page");
const staticSitePage = document.querySelector("#static-site-page");
const mailingListPage = document.querySelector("#mailing-list-page");

const pages = {
  landing: landingPage,
  planetSale: planetSalePage,
  staticSite: staticSitePage,
  mailingList: mailingListPage
};

const showPage = (key = null) => {
  if (!key) { return; }
  Object.keys(pages).forEach((k) => {
    if (k === key) {
      pages[k].style = '';
    } else {
      pages[k].style = 'display: none;';
    }
  });
};

planetSaleBtn.onclick = () => { showPage('planetSale'); };
staticSiteBtn.onclick = () => { showPage('staticSite'); };
mailingListBtn.onclick = () => { showPage('mailingList'); };

showPage('landing');


//== Mailing List Settings =====================================================

const apikeyInp = document.querySelector("#api-input");
const emailInp  = document.querySelector("#email-input");
const urlInp    = document.querySelector("#url-input");

const apikeyBtn = document.querySelector("#api-button");
const emailBtn  = document.querySelector("#email-button");
const urlBtn    = document.querySelector("#url-button");

let creds = {
  "api-key": '',
  "email": '',
  "ship-url": '',
}

apikeyBtn.onclick = () => {
  creds["api-key"] = apikeyInp.value;
  mailerPoke({"set-creds": creds});
}

emailBtn.onclick = () => {
  creds["email"] = emailInp.value;
  mailerPoke({"set-creds": creds});
}

urlBtn.onclick = () => {
  creds["ship-url"] = urlInp.value;
  mailerPoke({"set-creds": creds});
}

mailerScry('/creds').then((res) => {
  console.log('creds', res);
  if (res !== null) {
    creds = res;
    apikeyInp.value = creds["api-key"];
    emailInp.value  = creds["email"];
    urlInp.value    = creds["ship-url"];
  }
});

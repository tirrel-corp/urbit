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

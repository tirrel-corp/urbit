//== Top Level Navigation ======================================================

const planetSaleBtn = document.querySelector("#planet-sale-btn");
const publishBtn = document.querySelector("#publish-btn");

const landingPage = document.querySelector("#landing-page");
const planetSalePage = document.querySelector("#planet-sale-page");
const publishPage = document.querySelector("#publish-page");

const buttons = {
  planetSale: planetSaleBtn,
  publish: publishBtn
};

const pages = {
  landing: landingPage,
  planetSale: planetSalePage,
  publish: publishPage,
};

const showPage = (key = null) => {
  if (!key) { return; }
  Object.keys(pages).forEach((k) => {
    if (k === key) {
      if (buttons[k]) {
        buttons[k].style = 'background-color: #EEEEEE;'
      }
      pages[k].style = '';
    } else {
      pages[k].style = 'display: none;';

      if (buttons[k]) {
        buttons[k].style = '';
      }
    }
  });
};

planetSaleBtn.onclick = () => { showPage('planetSale'); };
publishBtn.onclick = () => { showPage('publish'); };

showPage('landing');


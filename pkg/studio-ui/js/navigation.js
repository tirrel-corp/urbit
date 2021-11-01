//== Top Level Navigation ======================================================

const saleBtn = document.querySelector("#sale-btn");
const publishBtn = document.querySelector("#publish-btn");

const landingPage = document.querySelector("#landing-page");
const salePage = document.querySelector("#sale-page");
const publishPage = document.querySelector("#publish-page");

const buttons = {
  sale: saleBtn,
  publish: publishBtn
};

const pages = {
  landing: landingPage,
  sale: salePage,
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

saleBtn.onclick = () => { showPage('sale'); };
publishBtn.onclick = () => { showPage('publish'); };

showPage('landing');


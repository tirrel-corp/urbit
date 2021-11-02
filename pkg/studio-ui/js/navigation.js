//== Top Level Navigation ======================================================

const landingBtn = document.querySelector("#landing-btn");
const publishBtn = document.querySelector("#publish-btn");
const sellBtn = document.querySelector("#sell-btn");

const landingPage = document.querySelector("#landing-page");
const sellPage = document.querySelector("#sell-page");
const publishPage = document.querySelector("#publish-page");

const buttons = {
  landing: landingBtn,
  sell: sellBtn,
  publish: publishBtn
};

const pages = {
  landing: landingPage,
  sell: sellPage,
  publish: publishPage,
};

const showPage = (key = null) => {
  if (!key) { return; }
  Object.keys(pages).forEach((k) => {
    if (k === key) {
      if (buttons[k]) {
        buttons[k].style = 'color: #000 !important;'
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

landingBtn.onclick = (e) => { showPage('landing'); };
sellBtn.onclick = (e) => { showPage('sell'); };
publishBtn.onclick = (e) => { showPage('publish'); };

if (location.hash === '#sell') {
  showPage('sell');
} else if (location.hash === '#publish') {
  showPage('publish');
} else {
  showPage('landing');
}


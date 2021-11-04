//== Top Level Navigation ======================================================

const landingBtn = document.querySelector("#landing-btn");
const publishBtn = document.querySelector("#publish-btn");

const sellBtn = document.querySelector("#sell-btn");
const sellStatusBtn = document.querySelector("#sell-status-btn");
const sellSettingsBtn = document.querySelector("#sell-settings-btn");


const landingPage = document.querySelector("#landing-page");
const publishPage = document.querySelector("#publish-page");

const sellPage = document.querySelector("#sell-page");
const sellStatusPage = document.querySelector("#sell-status-inner-page");
const sellSettingsPage = document.querySelector("#sell-settings-inner-page");


const buttons = {
  landing: landingBtn,
  sell: sellBtn,
  sellStatus: sellStatusBtn,
  sellSettings: sellSettingsBtn,
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


const innerButtons = {
  sell: {
    status: sellStatusBtn,
    settings: sellSettingsBtn
  }
};

const innerPages = {
  sell: {
    status: sellStatusPage,
    settings: sellSettingsPage
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


landingBtn.onclick = (e) => { showPage('landing'); };

sellBtn.onclick = (e) => { showPage('sell'); showInnerPage('sell', 'status'); };

sellStatusBtn.onclick = (e) => {
  showPage('sell');
  showInnerPage('sell', 'status');
};

sellSettingsBtn.onclick = (e) => {
  showPage('sell');
  showInnerPage('sell', 'settings');
};

publishBtn.onclick = (e) => { showPage('publish'); };

if (location.hash === '#sell' || location.hash === '#sell-status') {
  showPage('sell');
  showInnerPage('sell', 'status');
} else if (location.hash === '#sell-settings') {
  showPage('sell');
  showInnerPage('sell', 'settings');
} else if (location.hash === '#publish') {
  showPage('publish');
} else {
  showPage('landing');
}


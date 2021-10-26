//== Mailing List Settings =====================================================

const apikeyInp = document.querySelector("#sendgrid-api-input");
const emailInp  = document.querySelector("#sendgrid-email-input");
const urlInp    = document.querySelector("#sendgrid-url-input");

const credsBtn  = document.querySelector("#sendgrid-creds-button");

let creds = {
  "api-key": '',
  "email": '',
  "ship-url": '',
}

credsBtn.onclick = () => {
  creds["api-key"]  = apikeyInp.value;
  creds["email"]    = emailInp.value;
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

//== Static Site Settings ======================================================

const flowNameInp = document.querySelector("#flow-name-input");
const resourceInp = document.querySelector("#flow-res-input");
const indexInp    = document.querySelector("#flow-index-input");
const markInp     = document.querySelector("#flow-mark-input");
const serveInp    = document.querySelector("#flow-serve-input");
const emailInp    = document.querySelector("#flow-email-input");

const addFlowBtn = document.querySelector("#add-flow-btn");

addFlowBtn.onclick = () => {
  const res = resourceInp.value.split("/");
  if (res.length !== 2) { return; }
  const ship = res[0];
  const name = res[1];

  pipePoke({
    add: {
      name: flowNameInp.value,
      flow: {
        resource: {
          ship: ship,
          name: name
        },
        index: indexInp.value,
        mark: markInp.value,
        serve: !!serveInp.value,
        email: emailInp.value,
      }
    }
  });
};

const flowRemoveNameInp = document.querySelector("#flow-remove-name-input");
const removeFlowBtn = document.querySelector("#remove-flow-btn");

removeFlowBtn.onclick = () => {
  pipePoke({
    remove: {
      name: flowRemoveNameInp.value
    }
  });
};



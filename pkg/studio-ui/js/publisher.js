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
  pipePoke({
    add: {
      name: "foo",
      flow: {
        resource: {
          ship: "~zod",
          name: "my-blog-4283"
        },
        index: "/",
        mark: "pipe-template-email",
        serve: true,
        email: true,
      }
    }
  });
};

const flowRemoveNameInp = document.querySelector("#flow-remove-name-input");

const removeFlowBtn = document.querySelector("#remove-flow-btn");

removeFlowBtn.onclick = () => {
  pipePoke({
    add: {
      name: "foo",
      flow: {
        resource: {
          ship: "~zod",
          name: "my-blog-4283"
        },
        index: "/",
        mark: "pipe-template-email",
        serve: true,
        email: true,
      }
    }
  });
};



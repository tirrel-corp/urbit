//== Mailing List Settings =====================================================

const apikeyInp = document.querySelector("#api-input");
const emailInp  = document.querySelector("#email-input");
const urlInp    = document.querySelector("#url-input");

const credsBtn  = document.querySelector("#creds-button");

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


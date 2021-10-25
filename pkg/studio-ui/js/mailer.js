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


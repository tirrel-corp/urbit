//== Publish Settings ==========================================================

const manageExisting = document.querySelector("#manage-existing");
const addNew         = document.querySelector("#add-new");
const emptyFlows     = document.querySelector("#empty-flows");
const addFlowBtn     = document.querySelector("#add-flow-btn");
const notebookList   = document.querySelector("#notebook-list");
const notebookListContainer   = document.querySelector("#notebook-list-container");
const emptyNotebooks = document.querySelector("#empty-notebooks");
const cancelAdd      = document.querySelector("#cancel-add");
const publish        = document.querySelector("#publish-page");

let nav = {
  expandAdd: false,
  expandedBooks: {},
  expandedFlows: {}
}


addFlowBtn.onclick = () => {
  addFlowBtn.style.display = 'none';
  manageExisting.style.display = 'none';
  cancelAdd.style.display = '';
  notebookList.style.display = '';
  nav.expandAdd = true;
  nav.expandedBooks = {};
};

cancelAdd.onclick = () => {
  addFlowBtn.style.display = '';
  manageExisting.style.display = '';
  cancelAdd.style.display = 'none';
  notebookList.style.display = 'none';
  nav.expandAdd = false;
  nav.expandedBooks = {};
}

const validateEmail = (email) => {
      const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(email).toLowerCase());
}

const validateDomain = (domain) => {
  const re = /^([A-Za-z0-9-]+\.)?[A-Za-z0-9-]+\.+[A-Za-z]+(:\d{2,5})?$/;

  return re.test(String(domain).toLowerCase());
}

const validatePath = (path) => {
  const re = /^(\/[\w|-]+)+$/
  return re.test(String(path));
}

const validateApiKey = (key) => {
  return ((key.slice(0, 3) === "SG.") && (key.length === 69));
}

const createRemove = (name, sub) => {
  let erDiv = document.createElement('div');
  erDiv.className = "flex mv1";
  let er = document.createElement('p');
  er.className = "mv1 mr2 pa1 w5-ns"
  er.innerHTML = sub;

  let eb = document.createElement('button');
  eb.innerHTML = '-';
  eb.className = "w2 b bg-white red br3 ba ml3 pa1 pointer b--red hover-bg-washed-red";
  eb.onclick = () => {
    let mailerDel = {
      "del-recipients": {
        name: name,
        list: [sub]
      }
    };
    mailerPoke(mailerDel).then((res) => {
      erDiv.remove();
    });
  }
  erDiv.appendChild(er);
  erDiv.appendChild(eb);
  return erDiv;
}

const createFlow = (name, flow, book, subscribers) => {
  console.log('createFlow', flow, book, subscribers);
  let node = document.createElement('div');
  node.className = "mt2 ba br1 mw6 flex-column b--black bg-white";

  let title = document.createElement('h3');
  title.className = "pa3 ma0 pointer";

  if (book === null) {
    let headerDiv = document.createElement('div')
    headerDiv.className = "flex justify-between";
    title.innerHTML = flow.resource.name
    let spinner = document.createElement('div');
    spinner.className = "loader ma3";
    headerDiv.appendChild(title);
    headerDiv.appendChild(spinner);
    node.appendChild(headerDiv);
    return node;
  }

  let expansion = document.createElement('div');
  expansion.className = "ma3 flex-column flex";
  expansion.style.display = 'none';

  if (book.metadata.description !== '') {
    let description = document.createElement('p');
    description.innerHTML = book.metadata.description;
    description.className = "ma0 dark-gray";
    expansion.appendChild(description);
  }

  let date = document.createElement('p');
  let dateString = book.metadata["date-created"].split('..')[0];
  date.innerHTML = `created on ${dateString}`;
  date.className = "ma0 mt1 gray f6";
  expansion.appendChild(date);

  let emailDiv = document.createElement('div');
  emailDiv.className = "flex flex-column";
  emailDiv.style.display = 'none';

  if (subscribers !== null) {
    let subs = document.createElement('p');
    subs.innerHTML = (subscribers.length == 1) ? '1 subscriber' :
      `${subscribers.length} subscribers`;
    subs.className = "ma0 gray f6";
    expansion.appendChild(subs);
    emailDiv.style.display = '';
  }

  let nlDiv = document.createElement('div');
  let niceLink = document.createElement('a');
  niceLink.innerHTML = "View Site";
  niceLink.className="black underline pointer";
  let b = flow.site.binding;
  niceLink.href = (b.site)
    ? `http://${b.site}${b.path}`
    : flow.site.binding.path;
  niceLink.target = "_blank"
  nlDiv.className = "mt3";
  nlDiv.appendChild(niceLink);
  expansion.appendChild(nlDiv);

  let elDiv = document.createElement('div');
  let editLink = document.createElement('a');
  editLink.innerHTML = "Write";
  editLink.href = `/apps/landscape/~landscape${book.group}/resource/publish${book.resource}`;
  editLink.target = "_blank"
  editLink.className="black underline pointer";
  elDiv.className = "mt3";
  elDiv.appendChild(editLink);
  expansion.appendChild(elDiv);

  let cancel = document.createElement('button');
  cancel.innerHTML = "Cancel Publishing"
  cancel.className = "w5-ns bg-white red br3 mt3 mb3 ba pa2 pointer b--red hover-bg-washed-red"
  cancel.onclick = () => {
    nav.expandedFlows[name].cancel = true;
    cancel.style.display = 'none';
    areYouSure.style.display = ''
  }

  let areYouSure = document.createElement('div');
  areYouSure.className = "flex mt3"
  areYouSure.style.display = 'none';

  if (nav.expandedFlows[name] && nav.expandedFlows[name].cancel) {
    cancel.style.display = 'none';
    areYouSure.style.display = '';
  }

  let sureText = document.createElement('p');
  sureText.innerHTML = "Are you sure you want to cancel publishing?"
  sureText.className = "red bold mr2"

  let yes = document.createElement('button');
  yes.innerHTML = "Yes"
  yes.className = "w3-ns bg-white red br3 ba mv2 pa2 pointer b--red hover-bg-washed-red mr2"
  yes.onclick = () => {
    let pipeAction = {
      remove: { name }
    };

    let mailerAction = {
      "del-list": { name }
    };

    pipePoke(pipeAction).then((res) => {
      delete nav.expandedFlows[name];
      if (subscribers !== null) {
        mailerPoke(mailerAction);
      }
    });
  }

  let no = document.createElement('button');
  no.innerHTML = "No"
  no.className = "w3 bg-white blue br3 ba mv2 pa2 pointer b--blue hover-bg-washed-blue"
  no.onclick = () => {
    nav.expandedFlows[name].cancel = false;
    cancel.style.display = '';
    areYouSure.style.display = 'none'
  }


  let emailList = document.createElement('div');
  emailList.style.display = 'none';
  emailList.className = "flex flex-column";

  let showEmail = document.createElement('button');
  showEmail.innerHTML = "Manage Subscribers";
  showEmail.className = "mv2 w5-ns bg-white black br3 ba pa2 pointer b--black hover-bg-near-white";
  emailList.style.display = (nav.expandedFlows[name] && nav.expandedFlows[name].subs) ? '' : 'none';
  showEmail.onclick = () => {
    nav.expandedFlows[name].subs = !nav.expandedFlows[name].subs;
    emailList.style.display = (nav.expandedFlows[name].subs) ? '' : 'none';
  }

  let addEmailDiv = document.createElement('div');
  addEmailDiv.className = "flex mv1 w-100";
  let addEmail = document.createElement('input');
  addEmail.className = "w5-ns pa2 ba b--near-black black br1 input-reset bg-white";
  addEmail.placeholder = "recipient@example.com"

  let addEmailButton = document.createElement('button');
  addEmailButton.innerHTML = "+";
  addEmailButton.disabled = true;
  addEmailButton.className = "w2 b bg-near-white gray br3 ba ml2 pa1 b--light-silver hover-bg-near-white";

  addEmail.oninput = () => {
    if (validateEmail(addEmail.value)) {
      addEmail.className = "w5-ns pa2 ba b--green green br1 input-reset bg-washed-green";
      addEmailButton.className = "w2 b bg-white black br3 ba ml2 pa1 b--black hover-bg-near-white";
      addEmailButton.disabled = false;
    } else {
      addEmail.className = "w5-ns pa2 ba b--near-black black br1 input-reset bg-white";
      addEmailButton.className = "w2 b bg-near-white gray br3 ba ml2 pa1 b--light-silver hover-bg-near-white";
      addEmailButton.disabled = true;
    }
  }

  addEmailButton.onclick = () => {
    let mailerDel = {
      "add-recipients": {
        name: name,
        list: [addEmail.value]
      }
    };
    mailerPoke(mailerDel);
  }

  addEmailDiv.appendChild(addEmail);
  addEmailDiv.appendChild(addEmailButton);

  emailList.appendChild(addEmailDiv);
  if (subscribers != null && subscribers.length != 0) {
    subscribers.forEach((sub) => {
      let rem = createRemove(name, sub);
      emailList.appendChild(rem);
    });
  }

  emailDiv.appendChild(showEmail);
  emailDiv.appendChild(emailList);


  areYouSure.appendChild(sureText);
  areYouSure.appendChild(yes);
  areYouSure.appendChild(no);

  expansion.appendChild(cancel);
  expansion.appendChild(areYouSure);
  expansion.appendChild(emailDiv);

  title.innerHTML = book.metadata.title;

  if (nav.expandedFlows[name]) {
    title.className = "pa3 ma0 bg-near-white pointer";
    expansion.style.display = '';
  }
  title.onclick = () => {
    if (nav.expandedFlows[name]) {
      expansion.style.display = 'none'
      title.className = "pa3 ma0 pointer";
      delete nav.expandedFlows[name]
    } else {
      title.className = "pa3 ma0 bg-near-white pointer";
      expansion.style.display = '';
      nav.expandedFlows[name] = {cancel: false, subs: false};
    }
  }
  node.appendChild(title);
  node.appendChild(expansion);
  return node;
}

const resourceFromPath = (path) => {
  const [, , ship, name] = path.split('/');
  return {ship, name};
}

const processCSV = (csv) => {
  csv = csv.split('\n')
  csv = csv.map((line) => line.split(',')[0]);
  if (csv[csv.length - 1] === '') csv.pop();
  return csv;
}

const createBook = (notebook, templates, mailer) => {
  let res = resourceFromPath(notebook.resource);

  let hostValid = false;
  let pathValid = true;
  let editCreds = ((mailer.creds == null) || (mailer.creds.email === null));
  let apiValid = false;
  let emailValid = false;
  let templateValid = false;
  let mailCheckBool = false;
  let comCheckBool = false;

  let node = document.createElement('div');
  node.className = "mt2 ba br1 mw6 flex-column b--black bg-white";

  let submit = document.createElement('button');
  submit.className = "w5-ns ml2 mt3 pa3 bg-near-white gray bn br1 button-reset"
  submit.innerHTML = "Create";
  submit.disabled = true;

  let stage = 0;
  let titleDiv = document.createElement('div');
  titleDiv.className = "pa3 ma0 pointer flex justify-between"

  let title = document.createElement('h3');
  title.className = "pa0 ma0";
  title.innerHTML = notebook.metadata.title;

  let fullUrl = document.createElement('p');
  fullUrl.className = "mt1 mb0 f6 gray";
  fullUrl.style.display = 'none';

  titleDiv.appendChild(title);
  titleDiv.appendChild(fullUrl);

  let step1 = document.createElement('div');
  step1.className = "ma3 flex-column flex";

  let step2 = document.createElement('div');
  step2.className = "ma0 flex-column flex";
  step2.style.display = 'none';

//== Host name =================================================================
//
  let hostDiv = document.createElement('div');
  hostDiv.className = "w-100 pb2 pt2 flex justify-between";

  let hostLabel = document.createElement('p');
  hostLabel.className = "ma2"
  hostLabel.innerHTML = "Host name:";

  let host = document.createElement('input');
  host.className = "w5-ns pa2 ba b--near-black black br1 input-reset bg-white";
  host.placeholder = "example.com"

  host.oninput = () => {
    hostValid = validateDomain(host.value);
    if (hostValid) {
      host.className = "w5-ns pa2 ba b--green green br1 input-reset bg-washed-green";
    } else {
      host.className = "w5-ns pa2 ba b--near-black black br1 input-reset bg-white";
    }
    if ((hostValid && pathValid && templateValid) &&
        ((apiValid && emailValid) || !editCreds || !mailCheckBool)) {
      submit.className = "w5-ns ml2 mt3 pa3 bg-near-black white bn hover-bg-mid-gray br1 button-reset pointer"
      submit.disabled = false;
    } else {
      submit.className = "w5-ns ml2 mt3 pa3 bg-near-white gray bn br1 button-reset"
      submit.disabled = true;
    }
    if (hostValid && pathValid) {
      fullUrl.style.display = '';
      fullUrl.innerHTML = 'https://' + host.value + path.value;
    }
  }

//== Url path ==================================================================
//
  let pathDiv = document.createElement('div');
  pathDiv.className = "w-100 pb2 pt2 flex justify-between";

  let pathLabel = document.createElement('p');
  pathLabel.className = "ma2"
  pathLabel.innerHTML = "Path:";

  let path = document.createElement('input');
  path.className = "w5-ns pa2 ba b--green green br1 input-reset bg-washed-green";
  path.value = `/${res.name}`;

  path.oninput = () => {
    pathValid = validatePath(path.value);
    if (pathValid) {
      path.className = "w5-ns pa2 ba b--green green br1 input-reset bg-washed-green";
    } else {
      path.className = "w5-ns pa2 ba b--near-black black br1 input-reset bg-white";
    }
    if ((hostValid && pathValid && templateValid) &&
        ((apiValid && emailValid) || !editCreds || !mailCheckBool)) {
      submit.className = "w5-ns ml2 mt3 pa3 bg-near-black white bn hover-bg-mid-gray br1 button-reset pointer"
      submit.disabled = false;
    } else {
      submit.className = "w5-ns ml2 mt3 pa3 bg-near-white gray bn br1 button-reset"
      submit.disabled = true;
    }
    if (hostValid && pathValid) {
      fullUrl.style.display = '';
      fullUrl.innerHTML = 'https://' + host.value + path.value;
    }
  }


//== Template choice ===========================================================
//
  let templateDiv = document.createElement('div');
  templateDiv.className = "w-100 pt3 flex justify-between bt"

  let t = document.createElement('p');
  t.className = 'ma2'
  t.innerHTML = 'Template:'

  let radioCol = document.createElement('div');
  radioCol.className = "flex-column w5-ns mh3"

  templates.site.forEach((f) => {
    let radioRow = document.createElement('div');
    let radioButton = document.createElement('input');
    let radioLabel = document.createElement('label');

    radioButton.oninput = () => {
      templateValid = true;
      if ((hostValid && pathValid && templateValid) &&
          ((apiValid && emailValid) || !editCreds || !mailCheckBool)) {
        submit.className = "w5-ns ml2 mt3 pa3 bg-near-black white bn hover-bg-mid-gray br1 button-reset pointer"
        submit.disabled = false;
      } else {
        submit.className = "w5-ns ml2 mt3 pa3 bg-near-white gray bn br1 button-reset"
        submit.disabled = true;
      }
    }

    radioRow.className = 'flex pv1'
    radioButton.type = "radio"
    radioButton.id = f;
    radioButton.name = "sitetemplate";
    radioButton.value = f;
    radioButton.className="ma1";
    radioLabel.innerHTML = f;
    radioLabel.className = "ml1";
    radioLabel.for = "sitetemplate"
    radioRow.appendChild(radioButton);
    radioRow.appendChild(radioLabel);

    radioCol.appendChild(radioRow);
  });

  let comDiv = document.createElement('div');
  comDiv.className = "flex ma2 mb3";
  let comText = document.createElement('p');
  comText.innerHTML = "Display comments";
  comText.className = "ma0";
  let comCheck = document.createElement('input');
  comCheck.className = "ml2 mt1";
  comCheck.type = "checkbox"
  comCheck.onclick = (e) => {
    comCheckBool = !comCheckBool;
  }
  comDiv.appendChild(comText);
  comDiv.appendChild(comCheck);


//== Enable email checkbox =====================================================
//
  let mailCheckDiv = document.createElement('div');
  mailCheckDiv.className = "flex pa2 pt3 bt"
  let mailCheckLabel = document.createElement('p');
  mailCheckLabel.innerHTML = "Enable email newsletter functionality with SendGrid";
  mailCheckLabel.className = "ma0";
  let mailCheck = document.createElement('input');
  mailCheck.className="ml2 mt1";
  mailCheck.type = "checkbox"
  mailCheck.onclick = (e) => {
    mailCheckBool = !mailCheckBool;
    if (mailCheckBool) {
      step2.style.display = '';
    } else {
      step2.style.display = 'none';
    }
    if ((hostValid && pathValid && templateValid) &&
        ((apiValid && emailValid) || !editCreds || !mailCheckBool)) {
      submit.className = "w5-ns ml2 mt3 pa3 bg-near-black white bn hover-bg-mid-gray br1 button-reset pointer"
      submit.disabled = false;
    } else {
      submit.className = "w5-ns ml2 mt3 pa3 bg-near-white gray bn br1 button-reset"
      submit.disabled = true;
    }
  }

  let helpDiv = document.createElement('p');
  helpDiv.innerHTML = "To send emails from your Urbit, you'll need a <a class='black' href='https://sendgrid.io' target='_blank'>SendGrid</a> account. And you will need to <a class='black' href='https://docs.sendgrid.com/ui/sending-email/sender-verification' target='_blank'>verify the email address</a> you want to send emails from, and <a class='black' href='https://debounce.io/resources/help-desk/integrations/getting-a-sendgrid-api-key/' target='_blank'>make an API key</a>."
  helpDiv.style.display = 'none'
  helpDiv.className = "bg-near-white ma2 pa3 br2";

  let showHelp = false;
  let mailHelp = document.createElement('a');
  mailHelp.innerHTML = "(?)";
  mailHelp.className = "mv0 ml1 pointer b underline"
  mailHelp.onclick = () => {
    showHelp = !showHelp;
    helpDiv.style.display = (showHelp) ? '' : 'none';
  }

  mailCheckDiv.appendChild(mailCheckLabel);
  mailCheckDiv.appendChild(mailHelp);
  mailCheckDiv.appendChild(mailCheck);

//== SendGrid api key ==========================================================
//
  let apiKeyDiv = document.createElement('div');
  apiKeyDiv.className = "w-100 pb2 pt2 flex justify-between";

  let apiKeyLabel = document.createElement('p');
  apiKeyLabel.className = "ma2"
  apiKeyLabel.innerHTML = "SendGrid api key:";

  let apiKey = document.createElement('input');
  if (editCreds){
    apiKey.className = "w5-ns pa2 ba b--near-black black br1 input-reset bg-white";
    apiKey.placeholder = "SG.AbCd..."
  } else {
    apiKey.disabled = true;
    apiKey.className = "w5-ns pa2 ba b--light-silver br1 input-reset bg-near-white";
    apiKey.value = "*********************************************************************";
  }

  apiKey.oninput = () => {
    apiValid = validateApiKey(apiKey.value);
    if (apiValid) {
      apiKey.className = "w5-ns pa2 ba b--green green br1 input-reset bg-washed-green";
    } else {
      apiKey.className = "w5-ns pa2 ba b--near-black black br1 input-reset bg-white";
    }
    if ((hostValid && pathValid && templateValid) &&
        ((apiValid && emailValid) || !editCreds || !mailCheckBool)) {
      submit.className = "w5-ns ml2 mt3 pa3 bg-near-black white bn hover-bg-mid-gray br1 button-reset pointer"
      submit.disabled = false;
    } else {
      submit.className = "w5-ns ml2 mt3 pa3 bg-near-white gray bn br1 button-reset"
      submit.disabled = true;
    }
  }

  apiKeyDiv.appendChild(apiKeyLabel);
  apiKeyDiv.appendChild(apiKey);

//== Email Address =============================================================
//
  let emailDiv = document.createElement('div');
  emailDiv.className = "w-100 pb3 pt2 flex justify-between";

  let emailLabel = document.createElement('p');
  emailLabel.className = "ma2"
  emailLabel.innerHTML = "Email address:";

  let email = document.createElement('input');
  if (editCreds) {
    email.className = "w5-ns pa2 ba b--near-black black br1 input-reset bg-white";
    email.placeholder = "me@example.com"
  } else {
    email.disabled = true;
    email.className = "w5-ns pa2 ba b--light-silver br1 input-reset bg-near-white";
    email.value = mailer.creds.email;
  }

  email.oninput = () => {
    emailValid = validateEmail(email.value);
    if (emailValid) {
      email.className = "w5-ns pa2 ba b--green green br1 input-reset bg-washed-green";
    } else {
      email.className = "w5-ns pa2 ba b--near-black black br1 input-reset bg-white";
    }
    if ((hostValid && pathValid && templateValid) &&
        ((apiValid && emailValid) || !editCreds || !mailCheckBool)) {
      submit.className = "w5-ns ml2 mt3 pa3 bg-near-black white bn hover-bg-mid-gray br1 button-reset pointer"
      submit.disabled = false;
    } else {
      submit.className = "w5-ns ml2 mt3 pa3 bg-near-white gray bn br1 button-reset"
      submit.disabled = true;
    }
  }

  emailDiv.appendChild(emailLabel);
  emailDiv.appendChild(email);

//== SendGrid edit  ============================================================
//

  let editDiv = document.createElement('div');
  editDiv.className = "w-100 pb2 pt2 flex";
  let editLabel = document.createElement('p');
  editLabel.className = "ma2 green b"
  editLabel.innerHTML = "SendGrid credentials already set";

  let editButton = document.createElement('button');
  editButton.innerHTML = "Edit"
  editButton.className = "w3-ns bg-white black br3 ba ml4 pa1 pointer b--black hover-bg-near-white mr2"
  editButton.onclick = () => {
    editCreds = !editCreds;
    if (editCreds) {
      editButton.className = "w3-ns bg-black white br3 ba ml4 pa1 pointer b--black hover-bg-near-black mr2"
      editButton.innerHTML = "Cancel"
      email.disabled = false;
      email.className = "w5-ns pa2 ba b--green green br1 input-reset bg-washed-green";
      email.placeholder = "me@example.com"
      apiKey.disabled = false;
      apiKey.className = "w5-ns pa2 ba b--near-black black br1 input-reset bg-white";
      apiKey.placeholder = "SG.AbCd..."
      apiKey.value = '';
      apiValid = false;
    } else {
      editButton.innerHTML = "Edit"
      editButton.className = "w3-ns bg-white black br3 ba ml4 pa1 pointer b--black hover-bg-near-white mr2"
      email.disabled = true;
      email.className = "w5-ns pa2 ba b--light-silver br1 input-reset bg-near-white";
      email.value = mailer.creds.email;
      apiKey.disabled = true;
      apiKey.className = "w5-ns pa2 ba b--light-silver br1 input-reset bg-near-white";
      apiKey.value = "*********************************************************************";
      apiValid = true;
    }
    if ((hostValid && pathValid && templateValid) &&
        ((apiValid && emailValid) || !editCreds || !mailCheckBool)) {
      submit.className = "w5-ns ml2 mt3 pa3 bg-near-black white bn hover-bg-mid-gray br1 button-reset pointer"
      submit.disabled = false;
    } else {
      submit.className = "w5-ns ml2 mt3 pa3 bg-near-white gray bn br1 button-reset"
      submit.disabled = true;
    }
  }

  editDiv.appendChild(editLabel);
  editDiv.appendChild(editButton);

//== Mailing List ==============================================================
//
  let mailingDiv = document.createElement('div');
  mailingDiv.className = "w-100 pt2 flex justify-between bt";

  let mailingLabel = document.createElement('p');
  mailingLabel.className = "ma2"
  mailingLabel.innerHTML = "Add email recipients";

  mailingDiv.appendChild(mailingLabel);

//== Upload csv ================================================================
//
  let uploadDiv = document.createElement('div');
  uploadDiv.className = "w-100 pb2 pt2 flex justify-between";

  let uploadLabel = document.createElement('p');
  uploadLabel.className = "ma2"
  uploadLabel.innerHTML = "Upload mailing list csv:";

  let upload = document.createElement('input');
  let csv="";
  upload.type = "file";
  upload.name = "csv";
  upload.id   = "upload";
  upload.className = "w5-ns pa2 ba b--near-black br1 input-reset";
  upload.addEventListener('change', (e) => {
    upload.files[0].text().then((f) => {
      csv = f;
    });
  }, false);

  uploadDiv.appendChild(uploadLabel);
  uploadDiv.appendChild(upload);

//== Mailing List ==============================================================
//
  emailList = {};

  let emailListDiv = document.createElement('div');
  emailListDiv.className = "flex flex-column ma2";

  let emailAddDiv = document.createElement('div');
  emailAddDiv.className = "w-100 flex mv1";

  let emailAdd = document.createElement('input');
  emailAdd.className = "w5-ns pa2 ba b--near-black br1 input-reset bg-white";
  emailAdd.placeholder = "recipient@example.com";

  let emailAddButton = document.createElement('button');
  emailAddButton.className = "w2 b bg-near-white gray br3 ba ml2 pa1 b--light-silver hover-bg-near-white"
  emailAddButton.disabled = true;
  emailAddButton.innerHTML = "+";
  emailAddDiv.appendChild(emailAdd);
  emailAddDiv.appendChild(emailAddButton);

  emailListDiv.appendChild(emailAddDiv);

  emailAddButton.onclick = () => {
    emailList[emailAdd.value] = true;
    let emailRemoveDiv = document.createElement('div');
    emailRemoveDiv.className = "w-100 flex mv1";

    let emailRemove = document.createElement('input');
    emailRemove.className = "w5-ns pa2 ba b--near-black br1 input-reset";
    emailRemove.disabled = true;
    emailRemove.value = emailAdd.value;

    let emailRemoveButton = document.createElement('button');
    emailRemoveButton.className = "w2 b bg-white red br3 ba ml2 pa1 pointer b--red hover-bg-washed-red"
    emailRemoveButton.innerHTML = "-";
    emailRemoveButton.onclick = () => {
      delete emailList[emailRemove.value];
      emailRemoveDiv.remove();
    }
    emailRemoveDiv.appendChild(emailRemove);
    emailRemoveDiv.appendChild(emailRemoveButton);
    emailListDiv.insertBefore(emailRemoveDiv, emailAddDiv);
    emailAdd.value = '';
    emailAdd.className = "w5-ns pa2 ba b--near-black black br1 input-reset bg-white";
    emailAddButton.disabled = true;
    emailAddButton.className = "w2 b bg-near-white gray br3 ba ml2 pa1 b--light-silver hover-bg-near-white"
  }

  emailAdd.oninput = () => {
    if (validateEmail(emailAdd.value)) {
      emailAdd.className = "w5-ns pa2 ba b--green green br1 input-reset bg-washed-green";
      emailAddButton.className = "w2 b bg-white black br3 ba ml2 pa1 pointer b--black hover-bg-near-white"
      emailAddButton.disabled = false;
    } else {
      emailAdd.className = "w5-ns pa2 ba b--near-black black br1 input-reset bg-white";
      emailAddButton.className = "w2 b bg-near-white gray br3 ba ml2 pa1 b--light-silver hover-bg-near-white"
      emailAddButton.disabled = true;
    }
  }



//== Submit button =============================================================
//


  submit.onclick = () => {
    let res = resourceFromPath(notebook.resource);
    let radioValue = document.querySelector('input[name="sitetemplate"]:checked').value;
    let mailingList = Object.keys(emailList).concat(processCSV(csv));

    let pipeAction = {
      add: {
        name: res.name,
        flow: {
          resource: res,
          index: '/',
          site: {
            template: radioValue,
            binding: {
              site: host.value,
              path: path.value
            },
            comments: comCheckBool,
          },
          email: 'light',
        }
      }
    };

    let mailerCredsAction = {
      "set-creds": {
        "api-key": apiKey.value,
        "email": email.value,
        "ship-url": host.value,
      }
    };

    let mailerListAction = {
      "add-list": {
        name: res.name,
        list: mailingList
      }
    };

    pipePoke(pipeAction).then((r) => {
      nav.expandAdd = false;
      nav.expandedBooks = {};
      nav.expandedFlows[res.name] = {cancel: false, subs: false};
      if (!mailCheckBool) return;
      if (editCreds) {
        mailerPoke(mailerCredsAction).then((r) => {
          mailerPoke(mailerListAction);
        });
      } else {
        mailerPoke(mailerListAction)
      }
    });
  }


  if ((mailer.creds != null) && (mailer.creds.email !== null)) {
    step2.appendChild(editDiv);
  }
  step2.appendChild(apiKeyDiv);
  step2.appendChild(emailDiv);
  step2.appendChild(mailingDiv);
  step2.appendChild(uploadDiv);
  step2.appendChild(emailListDiv);

  templateDiv.appendChild(t);
  templateDiv.appendChild(radioCol);

  hostDiv.appendChild(hostLabel);
  hostDiv.appendChild(host);

  pathDiv.appendChild(pathLabel);
  pathDiv.appendChild(path);

  step1.appendChild(hostDiv);
  step1.appendChild(pathDiv);
  step1.appendChild(templateDiv);
  step1.appendChild(comDiv);
  step1.appendChild(mailCheckDiv);
  step1.appendChild(helpDiv);
  step1.appendChild(step2);
  step1.appendChild(submit);

  node.appendChild(titleDiv);

  if (nav.expandedBooks[notebook.resource]) {
    node.appendChild(step1);
    titleDiv.className = "pa3 ma0 bg-near-white pointer flex justify-between";
  }

  titleDiv.onclick = () => {
    if (stage == 0) {
      titleDiv.className = "pa3 ma0 bg-near-white pointer flex justify-between";
      node.appendChild(step1);
      nav.expandedBooks[notebook.resource] = true;
      stage = 1;
    } else {
      titleDiv.className = "pa3 ma0 pointer flex justify-between";
      delete nav.expandedBooks[notebook.resource];
      stage = 0;
      node.removeChild(step1)
    }
  }

  return node;
}

const publishRender = (state) => {

  let flows = state.pipe.flows;
  let books = state.notebooks;
  let mailer = state.mailer;

  if (nav.expandAdd) {
    addFlowBtn.style.display = 'none';
    manageExisting.style.display = 'none';
    cancelAdd.style.display = '';
    notebookList.style.display = '';
  } else {
    addFlowBtn.style.display = '';
    manageExisting.style.display = '';
    cancelAdd.style.display = 'none';
    notebookList.style.display = 'none';
  }

  manageExisting.textContent = '';
  let flowRes = [];
  if ((flows == null) || (Object.keys(flows).length === 0)) {
    emptyFlows.style = '';
  } else {
    emptyFlows.style = 'display: none';
    Object.keys(flows).forEach((f) => {
      let res = flows[f].resource;
      let resString = `/ship/~${res.ship}/${res.name}`;
      let book = books[resString] || null;
      let subs = (mailer["mailing-lists"]) ?
        mailer["mailing-lists"][f] || null : null;
      let flowNode = createFlow(f, flows[f], book, subs, nav);

      flowRes.push(resString);
      manageExisting.appendChild(flowNode);
    });
  }

  notebookList.textContent = '';
  let templates = state.pipe.templates;
  if ((books == null) || (Object.keys(books).length === 0)) {
    emptyNotebooks.style = '';
  } else {
    emptyNotebooks.style = 'display: none';
    Object.keys(books).forEach((f) => {
      let res = books[f].resource;
      if (flowRes.indexOf(res) === -1) {
        let bookNode = createBook(books[f], templates, mailer, nav);
        notebookList.appendChild(bookNode);
      }
    });
  }
}


addHookToStore(
  'publish',
  (state) => {
    publishRender(state);
  }
);

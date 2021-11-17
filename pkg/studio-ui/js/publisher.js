//== Publish Settings ==========================================================

const manageExisting = document.querySelector("#manage-existing");
const addNew         = document.querySelector("#add-new");
const emptyFlows     = document.querySelector("#empty-flows");
const addFlowBtn     = document.querySelector("#add-flow-btn");
const notebookList   = document.querySelector("#notebook-list");
const emptyNotebooks = document.querySelector("#empty-notebooks");
const cancelAdd      = document.querySelector("#cancel-add");

addFlowBtn.onclick = () => {
  addFlowBtn.style.display = 'none';
  manageExisting.style.display = 'none';
  cancelAdd.style.display = '';
  notebookList.style.display = '';
};

cancelAdd.onclick = () => {
  addFlowBtn.style.display = '';
  manageExisting.style.display = '';
  cancelAdd.style.display = 'none';
  notebookList.style.display = 'none';
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

  if (subscribers !== null) {
    let subs = document.createElement('p');
    subs.innerHTML = (subscribers.length == 1) ? '1 subscriber' :
      `${subscribers.length} subscribers`;
    subs.className = "ma0 gray f6";
    expansion.appendChild(subs);
  }

  let nlDiv = document.createElement('div');
  let niceLink = document.createElement('a');
  niceLink.innerHTML = "View Site";
  niceLink.className="black underline pointer";
  let b = flow.site.binding;
  niceLink.href = (b.site)
    ? `http://${b.site}${b.path}`
    : flow.site.binding.path;
  nlDiv.className = "mt3";
  nlDiv.appendChild(niceLink);
  expansion.appendChild(nlDiv);

  let elDiv = document.createElement('div');
  let editLink = document.createElement('a');
  editLink.innerHTML = "Write";
  editLink.href = "";
  editLink.className="black underline pointer";
  elDiv.className = "mt3";
  elDiv.appendChild(editLink);
  expansion.appendChild(elDiv);

  let cancelling = false;

  let cancel = document.createElement('button');
  cancel.innerHTML = "Cancel Publishing"
  cancel.className = "w5-ns bg-white red br3 mt3 mb3 ba pa2 pointer b--red hover-bg-washed-red"
  cancel.onclick = () => {
    cancelling = true;
    cancel.style.display = 'none';
    areYouSure.style.display = ''
  }

  let areYouSure = document.createElement('div');
  areYouSure.className = "flex mt3"
  areYouSure.style.display = 'none';

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
      if (subscribers !== null) {
        mailerPoke(mailerAction);
      }
    });
  }

  let no = document.createElement('button');
  no.innerHTML = "No"
  no.className = "w3 bg-white blue br3 ba mv2 pa2 pointer b--blue hover-bg-washed-blue"
  no.onclick = () => {
    cancelling = false;
    cancel.style.display = '';
    areYouSure.style.display = 'none'
  }

  areYouSure.appendChild(sureText);
  areYouSure.appendChild(yes);
  areYouSure.appendChild(no);

  expansion.appendChild(cancel);
  expansion.appendChild(areYouSure);


  let expanded = false;
  title.innerHTML = book.metadata.title;
  title.onclick = () => {
    expanded = !expanded;
    if (expanded) {
      title.className = "pa3 ma0 bg-near-white pointer";
      expansion.style.display = ''
    } else {
      expansion.style.display = 'none'
      title.className = "pa3 ma0 pointer";
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

const createBook = (notebook, templates, i) => {
  let res = resourceFromPath(notebook.resource);

  let node = document.createElement('div');
  node.className = "mt2 ba br1 mw6 flex-column b--black bg-white";

  let stage = 0;
  let title = document.createElement('h3');
  title.className = "pa3 ma0 pointer";
  title.innerHTML = notebook.metadata.title;

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
  host.className = "w5-ns pa2 ba b--near-black br1 input-reset";
  host.placeholder = "example.com"

//== Url path ==================================================================
//
  let pathDiv = document.createElement('div');
  pathDiv.className = "w-100 pb2 pt2 flex justify-between";

  let pathLabel = document.createElement('p');
  pathLabel.className = "ma2"
  pathLabel.innerHTML = "Path:";

  let path = document.createElement('input');
  path.className = "w5-ns pa2 ba b--near-black br1 input-reset";
  path.value = `/${res.name}`;

//== Template choice ===========================================================
//
  let templateDiv = document.createElement('div');
  templateDiv.className = "w-100 pv2 flex justify-between"

  let t = document.createElement('p');
  t.className = 'ma2'
  t.innerHTML = 'Template:'

  let radioCol = document.createElement('div');
  radioCol.className = "flex-column w5-ns mh3"

  templates.site.forEach((f) => {
    let radioRow = document.createElement('div');
    let radioButton = document.createElement('input');
    let radioLabel = document.createElement('label');

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

//== Enable email checkbox =====================================================
//
  let mailCheckBool = false;
  let mailCheckDiv = document.createElement('div');
  mailCheckDiv.className = "flex ma2"
  let mailCheckLabel = document.createElement('p');
  mailCheckLabel.innerHTML = "Enable email newsletter functionality with SendGrid:";
  mailCheckLabel.className = "ma0";
  let mailCheck = document.createElement('input');
  mailCheck.className="ml3";
  mailCheck.type = "checkbox"
  mailCheck.onclick = (e) => {
    mailCheckBool = !mailCheckBool;
    if (mailCheckBool) {
      step2.style.display = '';
    } else {
      step2.style.display = 'none';
    }
  }
  mailCheckDiv.appendChild(mailCheckLabel);
  mailCheckDiv.appendChild(mailCheck);

//== SendGrid api key ==========================================================
//
  let apiKeyDiv = document.createElement('div');
  apiKeyDiv.className = "w-100 pb2 pt2 flex justify-between";

  let apiKeyLabel = document.createElement('p');
  apiKeyLabel.className = "ma2"
  apiKeyLabel.innerHTML = "SendGrid api key:";

  let apiKey = document.createElement('input');
  apiKey.className = "w5-ns pa2 ba b--near-black br1 input-reset";
  apiKey.placeholder = "SG.AbCd..."

  apiKeyDiv.appendChild(apiKeyLabel);
  apiKeyDiv.appendChild(apiKey);

//== Email Address =============================================================
//
  let emailDiv = document.createElement('div');
  emailDiv.className = "w-100 pb2 pt2 flex justify-between";

  let emailLabel = document.createElement('p');
  emailLabel.className = "ma2"
  emailLabel.innerHTML = "Email address:";

  let email = document.createElement('input');
  email.className = "w5-ns pa2 ba b--near-black br1 input-reset";
  email.placeholder = "me@example.com"

  emailDiv.appendChild(emailLabel);
  emailDiv.appendChild(email);

//== Upload csv ================================================================
//
  let uploadDiv = document.createElement('div');
  uploadDiv.className = "w-100 pb2 pt2 flex justify-between";

  let uploadLabel = document.createElement('p');
  uploadLabel.className = "ma2"
  uploadLabel.innerHTML = "Upload mailing list (csv):";

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

//== Submit button =============================================================
//
  let submit = document.createElement('button');
  submit.className = "w5-ns ml2 mt3 pa3 bg-near-black white bn hover-bg-mid-gray br1 button-reset pointer"
  submit.innerHTML = "Create";

  submit.onclick = () => {
    let res = resourceFromPath(notebook.resource);
    let radioValue = document.querySelector('input[name="sitetemplate"]:checked').value;
    let pipeAction = {
      add: {
        name: res.name,
        flow: {
          resource: res,
          index: '/',
          site: {
            template: radioValue,
            binding: {
              site: host.value || null,
              path: path.value || '/',
            },
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
        list: processCSV(csv)
      }
    };

    pipePoke(pipeAction).then((res) => {
      if (!mailCheckBool) return;
      mailerPoke(mailerCredsAction).then((res) => {
        mailerPoke(mailerListAction);
      });
    });
  }

  step2.appendChild(apiKeyDiv);
  step2.appendChild(emailDiv);
  step2.appendChild(uploadDiv);

  templateDiv.appendChild(t);
  templateDiv.appendChild(radioCol);

  hostDiv.appendChild(hostLabel);
  hostDiv.appendChild(host);

  pathDiv.appendChild(pathLabel);
  pathDiv.appendChild(path);

  step1.appendChild(hostDiv);
  step1.appendChild(pathDiv);
  step1.appendChild(templateDiv);
  step1.appendChild(mailCheckDiv);
  step1.appendChild(step2);
  step1.appendChild(submit);

  node.appendChild(title);

  title.onclick = () => {
    if (stage == 0) {
      title.className = "pa3 ma0 bg-near-white pointer";
      node.appendChild(step1);
      stage = 1;
    } else {
      title.className = "pa3 ma0 pointer";
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

  manageExisting.textContent = '';
  let flowRes = [];
  if ((flows == null) || (Object.keys(flows).length === 0)) {
    emptyFlows.style = '';
    console.log('foobar');
  } else {
    emptyFlows.style = 'display: none';
    Object.keys(flows).forEach((f) => {
      let res = flows[f].resource;
      let resString = `/ship/~${res.ship}/${res.name}`;
      let book = books[resString] || null;
      let subs = (mailer["mailing-lists"]) ?
        mailer["mailing-lists"][f] || null : null;
      let flowNode = createFlow(f, flows[f], book, subs);

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
        let bookNode = createBook(books[f], templates);
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

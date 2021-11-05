//== Mailing List Settings =====================================================




const manageExisting = document.querySelector("#manage-existing");
const addNew         = document.querySelector("#add-new");
const emptyFlows     = document.querySelector("#empty-flows");
const addFlowBtn     = document.querySelector("#add-flow-btn");
const notebookList   = document.querySelector("#notebook-list");
const emptyNotebooks = document.querySelector("#empty-notebooks");

//const sgApikeyInp = document.querySelector("#sendgrid-api-input");
//const sgEmailInp  = document.querySelector("#sendgrid-email-input");
//const sgUrlInp    = document.querySelector("#sendgrid-url-input");
//
//const credsBtn  = document.querySelector("#sendgrid-creds-button");
//
//let creds = {
//  "api-key": '',
//  "email": '',
//  "ship-url": '',
//}
//
//credsBtn.onclick = () => {
//  creds["api-key"]  = sgApikeyInp.value;
//  creds["email"]    = sgEmailInp.value;
//  creds["ship-url"] = sgUrlInp.value;
//  mailerPoke({"set-creds": creds});
//}
//
//mailerScry('/creds').then((res) => {
//  console.log('creds', res);
//  if (res !== null) {
//    creds = res;
//    sgApikeyInp.value = creds["api-key"];
//    sgEmailInp.value  = creds["email"];
//    sgUrlInp.value    = creds["ship-url"];
//  }
//});

//== Static Site Settings ======================================================

//const flowNameInp = document.querySelector("#flow-name-input");
//const resourceInp = document.querySelector("#flow-res-input");
//const indexInp    = document.querySelector("#flow-index-input");
//const markInp     = document.querySelector("#flow-mark-input");
//const serveInp    = document.querySelector("#flow-serve-input");
//const emailInp    = document.querySelector("#flow-email-input");
//
//const addFlowBtn = document.querySelector("#add-flow-btn");
//
//addFlowBtn.onclick = () => {
//  const res = resourceInp.value.split("/");
//  if (res.length !== 2) { return; }
//  const ship = res[0];
//  const name = res[1];
//
//  pipePoke({
//    add: {
//      name: flowNameInp.value,
//      flow: {
//        resource: {
//          ship: ship,
//          name: name
//        },
//        index: indexInp.value,
//        mark: markInp.value,
//        serve: !!serveInp.value,
//        email: !!emailInp.value,
//      }
//    }
//  });
//};
//
//const flowRemoveNameInp = document.querySelector("#flow-remove-name-input");
//const removeFlowBtn = document.querySelector("#remove-flow-btn");
//
//removeFlowBtn.onclick = () => {
//  pipePoke({
//    remove: {
//      name: flowRemoveNameInp.value
//    }
//  });
//};
//

addFlowBtn.onclick = () => {
  notebookList.style.display = (notebookList.style.display === 'none')
    ? '' : 'none';
};

let flows = {};
let templates = {};
let notebooks = [];

const createFlow = (flow) => {
  console.log('createFlow', flow);
  let node = document.createElement('div');
  let link = document.createElement('a');
  link.href = flow.flow.site.binding.path;
  link.innerHTML = flow.metadata.title;
  link.className = "black ma3"
  node.className = "mv4 pa3 ba br1 w-50 flex-column b--black bg-white w5";
  node.appendChild(link);
  return node;
}

const createNotebook = (notebook, i) => {
  let node = document.createElement('div');
  node.className = "mt2 ba br1 w-50 flex-column b--black bg-white w5";

  let stage = 0;
  let title = document.createElement('h3');
  title.className = "pa3 ma0 pointer";
  title.innerHTML = notebook.metadata.title;

  let step1 = document.createElement('div');
  step1.className = "ma3 flex-column"

  let hostDiv = document.createElement('div');
  hostDiv.className = "w-100 pb2 pt2 flex justify-between";

  let hostLabel = document.createElement('p');
  hostLabel.className = "ma2"
  hostLabel.innerHTML = "Host name:";

  let host = document.createElement('input');
  host.className = "w5-ns pa2 ba b--near-black br1 input-reset";
  host.placeholder = "example.com"

  let pathDiv = document.createElement('div');
  pathDiv.className = "w-100 pb2 pt2 flex justify-between";

  let pathLabel = document.createElement('p');
  pathLabel.className = "ma2"
  pathLabel.innerHTML = "Path:";

  let path = document.createElement('input');
  path.className = "w5-ns pa2 ba b--near-black br1 input-reset";
  path.value = "/foo"

  let templateDiv = document.createElement('div');
  templateDiv.className = "w-100 pv-2 flex justify-between"

  let t = document.createElement('p');
  t.className = 'ma2'
  t.innerHTML = 'Template:'

  let radioCol = document.createElement('div');
  radioCol.className = "flex-column"

  templates.site.forEach((f) => {
    let radioRow = document.createElement('div');
    let radioButton = document.createElement('input');
    let radioLabel = document.createElement('label');

    radioRow.className = 'flex'
    radioButton.type = "radio"
    radioButton.id = f;
    radioButton.name = "template";
    radioLabel.innerHTML = f;
    radioLabel.for = "template"
    radioRow.appendChild(radioButton);
    radioRow.appendChild(radioLabel);

    radioCol.appendChild(radioRow);
  });

  let submit = document.createElement('button');
  submit.className = "w5-ns pa3 bg-near-black white bn over-bg-mid-gray br1 button-reset pointer"

  submit.onclick = () => {
    let action = {
      add: {
        name: notebook.resource.name,
        flow: {
          resource: {
            ship: `~${notebook.resource.ship}`,
            name: notebook.resource.name,
          },
          index: '/',
          site: {
            template: 'light',
            binding: {
              site: host.value || null,
              path: path.value || '/',
            },
          },
          email: null,
        }
      }
    };
    console.log('action', action);
    pipePoke(action);
  }

  templateDiv.appendChild(t);
  templateDiv.appendChild(radioCol);

  hostDiv.appendChild(hostLabel);
  hostDiv.appendChild(host);

  pathDiv.appendChild(pathLabel);
  pathDiv.appendChild(path);

  step1.appendChild(hostDiv);
  step1.appendChild(pathDiv);
  step1.appendChild(templateDiv);
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

const createInput = (label) => {
  let container = document.createElement('div');

  container.appendChild(p)
  container.appendChild(input);
  return container;
}

pipeScry('/flows').then((res) => {
  console.log('flows', res);
  if (res !== null) {
    flows = res;

    if (Object.keys(flows).length === 0) {
      emptyFlows.style = '';
    } else {
      emptyFlows.style = 'display: none';
    }

    Object.keys(flows).forEach((f) => {
      let flowNode = createFlow(flows[f]);
      manageExisting.appendChild(flowNode);
    });
  }
});

pipeScry('/templates').then((res) => {
  console.log('templates', res);
  if (res !== null) {
    templates = res;
  }
});


pipeScry('/notebooks').then((res) => {
  console.log('notebooks', res);
  if (res !== null) {
    notebooks = res;

    if (Object.keys(notebooks).length === 0) {
      emptyNotebooks.style = '';
    } else {
      emptyNotebooks.style = 'display: none';
    }

    Object.keys(notebooks).forEach((f, i) => {
      let notebookNode = createNotebook(notebooks[f], i);
      notebookList.appendChild(notebookNode);
    });
  }
});

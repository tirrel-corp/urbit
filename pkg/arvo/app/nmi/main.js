let startPayment = async () => {
  let data = `{
    "initiate-payment": "20.00"
  }`;

  const res = await fetch(`/pay`, {
    method: 'POST',
    headers: { 'Content-type': 'text/json' },
    body: data
  });

  return res.json();
};

let pollForStepOneResponse = (file, stepTwo = () => {}) => {
  setTimeout(() => {
    fetch(`/pay/${file}.json`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-type': 'text/json',
        'Access-Control-Allow-Origin':'*'
      },
      body: null
    }).then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error('Something went wrong');
      }
    }).then((result) => {
      stepTwo(result);
    }).catch((error) => {
      console.error('Error:', error);
      pollForStepOneResponse(file, stepTwo);
    });
  }, 500);
};

let stepTwo = (tokenId) => {
  let stepOne = document.getElementById('step1');
  stepOne.style = 'display:none;';

  let stepTwo = document.getElementById('step2');
  stepTwo.style = '';

  let form = document.getElementById('step2-form');
  form.action =
    `https://secure.networkmerchants.com/api/v2/three-step/${tokenId}`;
};

let stepThree = (tokenId) => {
  let data = `{
    "complete-payment": "${tokenId}"
  }`;

  fetch(`/pay`, {
    method: 'POST',
    headers: { 'Content-type': 'text/json' },
    body: data
  }).then((res) => {
    if (res.ok) {
      return res.json();
    } else {
      throw new Error('Something went wrong');
    }
  }).then(res => {
    let status = document.getElementById('step3-status');
    status.innerText = "Payment Successful!"
  })
  .catch((error) => {
    window.location.replace("http://urbit.studio/pay");
  });
};

let params = (new URL(document.location)).searchParams;
let tokenId = params.get('token-id');
if (!!tokenId && tokenId.length > 0) {
  let thirdStep = document.getElementById('step3');
  thirdStep.style = "";
  stepThree(tokenId);

} else {
  let firstStep = document.getElementById('step1');
  firstStep.style = "";

  let button = document.getElementById('step1-button');
  button.onclick = async () => {
    let firstResponse = await startPayment();
    pollForStepOneResponse(firstResponse, stepTwo);
  };

}


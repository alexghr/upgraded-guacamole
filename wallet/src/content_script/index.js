import { AZTEC as AZTEC } from '../message';

// this script gets injected into every page and forwards postMessage requests from the page

const port = browser.runtime.connect({ name: 'port-from-cs' });

port.onMessage.addListener((message) => {
  if (message?.from === AZTEC) {
    console.log('Forwarding Aztec message to the webpage', message);
    window.postMessage(message, '*');
  }
});

window.addEventListener('message', (message) => {
  if (message.data?.to === AZTEC) {
    console.log('Forwarding Aztec message to Wallet', message.data);
    port.postMessage(message.data);
  }
});

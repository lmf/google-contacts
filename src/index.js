import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const CLIENT_ID = '515175944616-qi5tcdda02k71aet672pf0di7rumcmqn.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCLxJXAd_-r5XV_86G64FZjekiG0x3pJfM';


// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/people/v1/rest';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/contacts.readonly';

// document.getElementById('authorize_button').style.visibility = 'hidden';
// document.getElementById('signout_button').style.visibility = 'hidden';

window.__CONTACT__ = {};

const root = ReactDOM.createRoot(document.getElementById('root'));

async function requestAuth() {
  if (window.gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    window.__CONTACT__.tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    window.__CONTACT__.tokenClient.requestAccessToken({prompt: ''});
  }
}

async function initializeGapiClient() {
  await window.gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  window.__CONTACT__.gapiInited = true;

  requestAuth();
}

(function init() {
  window.__CONTACT__.tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: async (resp) => {
      if (resp.error !== undefined) {
        throw (resp);
      }

      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    },
  });
  window.__CONTACT__.gisInited = true;

  window.gapi.load('client', initializeGapiClient);
})();



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

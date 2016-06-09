import {createTokenManager as createTokenManagerOidc, triggerAuthFlow} from 'redux-oidc';

const locationPort = window.location.port ? `:${window.location.port}` : '';
const redirectPathKey = 'redirectPathKey';

const oidcMagagerConfig = {
  client_id    : 'todoSample', // client id
  redirect_uri : `${window.location.protocol}//${window.location.hostname}${locationPort}/callback`, // callback url
  response_type: 'id_token token', // the response type from the token service
  scope        : 'openid profile email', // the scopes to include
  authority    : 'authority' // the authority
};

export function createTokenManagerConfig() {
  return oidcMagagerConfig;
}

export function createTokenManager() {
  return createTokenManagerOidc(oidcMagagerConfig);
}

export function setRedirectPath(path) {
  if (path === undefined) {
    localStorage.removeItem(redirectPathKey);
  } else {
    localStorage.setItem(redirectPathKey, path);
  }
}

export function getRedirectPath() {
  return localStorage.getItem(redirectPathKey);
}

export function requireAuth(nextState/*, replace*/) {
  if (createTokenManager().expired) {
    setRedirectPath(nextState.location.pathname);
    triggerAuthFlow(oidcMagagerConfig);
  }
}

export function triggerAuth() {
  setRedirectPath(window.location.pathname);
  triggerAuthFlow(oidcMagagerConfig);
}

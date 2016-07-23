import createOidcMiddleware from 'redux-oidc';
import userManager from '../helpers/oidcHelpers.jsx';

const oidcMiddleware = createOidcMiddleware(userManager);

export default oidcMiddleware

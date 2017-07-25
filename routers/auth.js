'use strict';

const periodic = require('periodicjs');
const csrf = require('csurf');
const authRouter = periodic.express.Router();
const controllers = require('../controllers');
const passportControllers = periodic.controllers.extension.get('periodicjs.ext.passport');
const utilities = require('../utilities');
const passportExtSettings = periodic.settings.extensions['periodicjs.ext.passport'];
const passportExtOAuth2Clients = passportExtSettings.oauth.oauth2client;
// const periodicRoutingUtil = periodic.utilities.routing;
const passport = periodic.locals.extensions.get('periodicjs.ext.passport').passport;

if (passportSettings.passport.use_csrf) {
  authRouter.use(csrf());
  authRouter.use(passportControllers.auth.useCSRF);
}

passportExtOAuth2Clients.forEach(oauth2client_settings => {
  const client = oauth2client_settings;
  const service_name = oauth2client_settings.service_name;
  const clientAuth = utilities.oauth.client_auth_request({ client });
  const userAuth = utilities.oauth.user_auth_request({ client });
  controllers.oauth2client.client_auth_request[service_name] = clientAuth;
  controllers.oauth2client.user_auth_request[service_name] = userAuth;
  authRouter.get(`/oauth2client-${service_name}`, passport.authenticate(`oauth2client-${service_name}`));
  authRouter.get(`/oauth2client-${service_name}/callback`, utilities.oauth.oauth2callback({ service_name }));
  // adminExtMenu["tree-item-folder-contents"].push({
  //   "tree-item": "file",
  //   "tree-item-label": `${oauth2client_settings.service_name} login`,
  //   "tree-item-id": `asyncadmin.extensions.oauth2client.${oauth2client_settings.service_name}`,
  //   "tree-item-link": "/auth/oauth2client-"+oauth2client_settings.service_name,
  //   "tree-item-attributes": {
  //     // "class": "async-admin-ajax-link",
  //     "title": `${oauth2client_settings.service_name} login`,
  //   "style":"background-image: url(/images/adminui/svg/user154.svg);"
  //   }
  // });
});

module.exports = authRouter;
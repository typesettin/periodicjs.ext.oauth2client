'use strict';
const capitalize = require('capitalize');
// console.log({ schemas });
// const customerScheme = require('../../../utility/reference/dsa/models/customerdata');
// const customerSchema = new customerScheme().attributes;
// const customer = new customerSchema().schema
// console.log( {customerSchema});
// console.log('new customerScheme()',new customerScheme());

module.exports = (periodic) => {
  let loginExtSettings = periodic.app.controller.extension.login.loginExtSettings;
  let clients = (loginExtSettings && loginExtSettings.passport && loginExtSettings.passport.oauth && loginExtSettings.passport.oauth.oauth2client && Array.isArray(loginExtSettings.passport.oauth.oauth2client) && loginExtSettings.passport.oauth.oauth2client.length > 0)
    ? loginExtSettings.passport.oauth.oauth2client
    : [];
  if (clients.length) {
    clients = clients.map(client => {
      return {
        "component": "a",
        "props": {
          "href": `/auth/oauth2client-${client.service_name}`,
          "id": `oauth2client-${client.service_name}`
        },
        "children": `${capitalize(client.service_name)} login`,
      };
    });
  } else {
    clients = [
      {
        "component": "MenuAppLink",
        "props": {
          "href": `#`,
          "label": `No OAuth2 Clients`,
          "id": `oauth2client-NOAUTH2CLIENTS`
        }
      }
    ];
  }
  // console.log({ clients });
  return {
    "wrapper": {
      "style": {}
    },
    "container": {
      "style": {}
    },
    "layout": {
      "component": "Menu",
      "props": {
        "style": {}
      },
      "children": [
        {
          component: "SubMenuLinks",
          children: [
            {
              "component": "MenuLabel",
              "children": "OAUTH2 Logins"
            }
          ].concat(clients)
        },
      ]
    }
  };
};
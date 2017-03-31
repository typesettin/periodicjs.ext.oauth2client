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
  let reactadmin = periodic.app.controller.extension.reactadmin;
  if (clients.length) {
    clients = clients.map(client => {
      return {
        "component": "li",
        children: [
          {
            "component": "a",
            "props": {
              "href": `/auth/oauth2client-${client.service_name}`,
              "id": `oauth2client-${client.service_name}`
            },
            "children": `${capitalize(client.service_name)} login`,
          }
        ]
      };
    });
  } else {
    clients = [
      {
        "component": "li",
        children: [
          {
            "component": "a",
            "props": {
              "href": `#`,
              "id": `oauth2client-NOAUTH2CLIENTS`
            },
            "children": `No OAuth2 Clients`,
          }
        ]
      }
    ];
  }
  // console.log({ clients });
  return {
    'containers': {
      [`${reactadmin.manifest_prefix}/extension/oauth2clients`]: {
        'layout': {
          component: 'Hero',
          props: {
            style: {
              padding: '5rem 0',
            },
          },
          // props: { size: 'isFullheight', },
          children: [ {
            component: 'HeroBody',
            props: {},
            children: [
              {
                component: 'Container',
                props: {},
                children: [
                  {
                    component: 'Title',
                    children: 'OAuth2 Logins',
                    
                  },
                  {
                    component: 'ul',
                    children: clients,
                  },
                
                ],
              },
            ],
          },
          ],
        },
        // 'resources':{
        //   // 'tabledata':'/r-admin/contentdata/users?format=json&limit=10',
        // },
        // dynamic: {
        //   dummydata: [1,2,3,4,5],
        // },
        'onFinish': 'render',
        'pageData': {
          'title': 'Home',
          'navLabel': 'Home',
        },
      },
    },
  };
};
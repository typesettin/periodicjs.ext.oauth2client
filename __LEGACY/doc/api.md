#Index

**Modules**

* [periodicjs.ext.oauth2client](#periodicjs.ext.module_oauth2client)
* [oauthController](#module_oauthController)

**Functions**

* [use_oauth_client()](#use_oauth_client)
* [oauth2callback(options)](#oauth2callback)
 
<a name="periodicjs.ext.module_oauth2client"></a>
#periodicjs.ext.oauth2client
An login authentication extension that uses passport oauth to connect to oauth2 service providers.

**Params**

- periodic `object` - variable injection of resources from current periodic instance  

**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2016 Typesettin. All rights reserved.  
<a name="module_oauthController"></a>
#oauthController
oauth2client login controller

**Params**

- resources `object` - variable injection from current periodic instance with references to the active logger and mongo session  

**Returns**: `object` - sendmail  
**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2016 Typesettin. All rights reserved.  
<a name="use_oauth_client"></a>
#use_oauth_client()
sets a name spaced passport authentication strategy based on the service name in the array of oauth clients, if the user exists, it will link the account, if the user is signed in, it will associate accounts, if the user doesnt exist it will recreate a new account

<a name="oauth2callback"></a>
#oauth2callback(options)
oauth callback

**Params**

- options `object` - pass a service name for the name spaced passport authentication oauth callback  

**Returns**: `function` - returns the express middleware for the oauth callback  

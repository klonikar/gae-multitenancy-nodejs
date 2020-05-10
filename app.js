/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// [START gae_flex_datastore_app]
'use strict';

const path = require('path');
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const DatastoreStore = require('@google-cloud/connect-datastore')(session);

const app = express();
app.enable('trust proxy');
app.use(express.json());
app.use('/', express.static(path.join(__dirname, 'public')));

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const {Datastore} = require('@google-cloud/datastore');

// Instantiate a datastore client
const datastore = new Datastore();

app.use(
  session({
    store: new DatastoreStore({
      dataset: datastore,
      expirationMs: 24*60*60*1000, // 24 hrs
      kind: 'express-sessions'
    }),
    expirationMs: 24*60*60*1000, // 24 hrs
    kind: 'express-sessions',
    secret: 'rocketvisionSecret',
    resave: false,
    saveUninitialized: true,
  })
);

app.post('/api/v1/login', (req, res, next) => {
  let data = req.body;
  if(!data.companyName && data.admin) { // Global Admin
    datastore.get(datastore.key({path: ['GlobalAdmin', data.userName]}), (err, entity) => {
      if(err) {
        res.status(500).set('Content-Type', 'application/json').send({"message": "Unknown error ocurred. Internal Server Error", error: err}).end();
      }
      else if(entity && entity.password === data.password) {
        req.session.userName = data.userName;
        req.session.globalAdmin = "true";
        req.session.enterpriseAdmin = "false";
        req.session.companyName = "";
        let respData = Object.assign({}, entity, {password: ""})
        res.status(200).set('Content-Type', 'application/json').send({response: respData}).end();
      }
      else {
        req.session.userName = "";
        req.session.globalAdmin = "false";
        req.session.enterpriseAdmin = "false";
        req.session.companyName = "";
        res.status(404).set('Content-Type', 'application/json').send({"message": "Invalid userName or password"}).end();
      }
    });
  }
  else if(data.admin) { // EnterpriseAdmin
    let namespace = data.companyName;
    datastore.get(datastore.key({namespace: namespace, path: ['EnterpriseAdmin', data.userName]}), (err, entity) => {
      if(err) {
        res.status(500).set('Content-Type', 'application/json').send({"message": "Unknown error ocurred. Internal Server Error", error: err}).end();
      }
      else if(entity && entity.password === data.password) {
        req.session.userName = data.userName;
        req.session.globalAdmin = "false";
        req.session.enterpriseAdmin = "true";
        req.session.companyName = data.companyName;
        let respData = Object.assign({}, entity, {password: ""})
        res.status(200).set('Content-Type', 'application/json').send({response: respData}).end();
      }
      else {
        req.session.userName = "";
        req.session.globalAdmin = "false";
        req.session.enterpriseAdmin = "false";
        req.session.companyName = "";
        res.status(404).set('Content-Type', 'application/json').send({message: "Invalid userName or password"}).end();
      }
    });
  }
  else if(data.companyName && !data.admin) { // Ordinary user
    let namespace = data.companyName;
    datastore.get(datastore.key({namespace: namespace, path: ['Employee', data.userName]}), (err, entity) => {
      if(err) {
        res.status(500).set('Content-Type', 'application/json').send({"message": "Unknown error ocurred. Internal Server Error", error: err}).end();
      }
      else if(entity && entity.password === data.password) {
        req.session.userName = data.userName;
        req.session.globalAdmin = "false";
        req.session.enterpriseAdmin = "false";
        req.session.companyName = data.companyName;
        let respData = Object.assign({}, entity, {password: ""})
        res.status(200).set('Content-Type', 'application/json').send({response: respData}).end();
      }
      else {
        req.session.userName = "";
        req.session.globalAdmin = "false";
        req.session.enterpriseAdmin = "false";
        req.session.companyName = "";
        res.status(404).set('Content-Type', 'application/json').send({message: "Invalid userName or password"}).end();
      }
    });
  }
  else { // invalid case... companyName == null && isAdmin == false
    req.session.userName = "";
    req.session.globalAdmin = "false";
    req.session.enterpriseAdmin = "false";
    req.session.companyName = "";
    res.status(404).set('Content-Type', 'application/json').send({message: "Invalid userName or password"}).end();
  }
});

app.get('/api/v1/logout', (req, res, next) => {
  let userName = req.session.userName;
  req.session.userName = "";
  req.session.globalAdmin = "false";
  req.session.enterpriseAdmin = "false";
  req.session.companyName = "";
  req.session.destroy(function() {
    res.status(200).set('Content-Type', 'application/json').send({message: `User ${userName} logged out.`}).end();
  });  
});

app.post('/api/v1/logout', (req, res, next) => {
  let userName = req.session.userName;
  req.session.userName = "";
  req.session.globalAdmin = "false";
  req.session.enterpriseAdmin = "false";
  req.session.companyName = "";
  req.session.destroy(function() {
    res.status(200).set('Content-Type', 'application/json').send({message: `User ${userName} logged out.`}).end();
  });
});

app.post('/api/v1/enterprise', (req, res, next) => {
  if(! req.session || ! req.session.globalAdmin || req.session.globalAdmin != "true") {
    res.status(401).set('Content-Type', 'application/json').send({message: "Unauthorized global admin access"}).end();
    return;
  }

  let data = req.body;
  data.createdDate = Date.now();
  const transaction = datastore.transaction();
  transaction.run((err) => {
    if(err) {
      // TODO: Error handling
      return;
    }
    let entities = [
      {
        key: datastore.key({namespace: data.name, path: ['Enterprise', data.name]}),
        data: data
      },
      {
        key: datastore.key({path: ['Enterprise', data.name]}),
        data: data
      },
      {
        key: datastore.key({namespace: data.name, path: ['EnterpriseAdmin', data.userName || 'enterpriseAdmin']}),
        data: data
      }
      ];
    if((!process.env.NODE_ENV || process.env.NODE_ENV === "development") && req.query.globalAdmin && req.query.globalAdmin === "true" ) {
      entities.push({
        key: datastore.key({path: ['GlobalAdmin', data.userName || 'globalAdmin']}),
        data: data
      });
    }  
    transaction.save(entities);
    transaction.commit((err, apiResponse) => {
      if(!err) {
        let respData = apiResponse.mutationResults;
        res.status(200).set('Content-Type', 'application/json').send({entities: entities, response: respData}).end();
      }
      else {
       res.status(500).set('Content-Type', 'application/json').send({"message": "Unknown error ocurred. Internal Server Error", error: err}).end(); 
      }
    });

  });
});

app.get('/api/v1/enterprise/:enterpriseId', (req, res, next) => {
  if(! req.session || ! req.session.globalAdmin || req.session.globalAdmin != "true") {
    res.status(401).set('Content-Type', 'application/json').send({message: "Unauthorized global admin access"}).end();
    return;
  }

  datastore.get(datastore.key(['Enterprise', req.params.enterpriseId]), (err, entity) => {
    if(err) {
      res.status(500).set('Content-Type', 'application/json').send({"message": "Unknown error ocurred. Internal Server Error", error: err}).end();
    }
    else if(entity) {
      res.status(200).set('Content-Type', 'application/json').send({response: entity}).end();
    }
    else {
      res.status(404).set('Content-Type', 'application/json').send({response: null}).end();
    }
  });
});

app.get('/api/v1/enterprise', (req, res, next) => {
  if(! req.session || ! req.session.globalAdmin || req.session.globalAdmin != "true") {
    res.status(401).set('Content-Type', 'application/json').send({message: "Unauthorized global admin access"}).end();
    return;
  }

  const query = datastore
    .createQuery('Enterprise')
    .order('createdDate', {descending: true})
    //.limit(10)
    ;

  datastore.runQuery(query, (err, entities, info) => {
    if(err) {
      res.status(500).set('Content-Type', 'application/json').send({"message": "Unknown error ocurred. Internal Server Error", error: err}).end();
    }
    else {
      res.status(200).set('Content-Type', 'application/json').send({response: entities}).end();
    }
  });

});

app.post('/api/v1/employee', (req, res, next) => {
  if(! req.session || ! req.session.enterpriseAdmin || req.session.enterpriseAdmin != "true") {
    res.status(401).set('Content-Type', 'application/json').send({message: "Unauthorized enterprise admin access"}).end();
    return;
  }

  let data = req.body;
  let companyName = req.session.companyName;
  data.createdDate = Date.now();
  data.companyName = companyName;
  const transaction = datastore.transaction();
  transaction.run((err) => {
    if(err) {
      // TODO: Error handling
      return;
    }
    let entities = [
      {
        key: datastore.key({namespace: companyName, path: ['Employee', data.userName]}),
        data: data
      }
      ];
    if(data.admin) {
      entities.push({
        key: datastore.key({namespace: companyName, path: ['EnterpriseAdmin', data.userName || 'enterpriseAdmin']}),
        data: data
      });
    }  
    transaction.save(entities);
    transaction.commit((err, apiResponse) => {
      if(!err) {
        let respData = apiResponse.mutationResults;
        res.status(200).set('Content-Type', 'application/json').send({entities: entities, response: respData}).end();
      }
      else {
       res.status(500).set('Content-Type', 'application/json').send({"message": "Unknown error ocurred. Internal Server Error", error: err}).end(); 
      }
    });

  });
});

app.get('/api/v1/employee/:employeeId', (req, res, next) => {
    if(!req.session || !req.session.userName) {
      res.status(401).set('Content-Type', 'application/json').send({message: "User not logged in."}).end();
      return;
    }
    if((!req.session.enterpriseAdmin || req.session.enterpriseAdmin != "true") &&
         req.session.userName != req.params.employeeId) {
      res.status(401).set('Content-Type', 'application/json').send({message: "Unauthorized enterprise admin access"}).end();
      return;
    }

    let namespace = req.session.companyName;
    datastore.get(datastore.key({namespace: namespace, path: ['Employee', req.params.employeeId]}), (err, entity) => {
      if(err) {
        res.status(500).set('Content-Type', 'application/json').send({"message": "Unknown error ocurred. Internal Server Error", error: err}).end();
      }
      else if(entity) {
        res.status(200).set('Content-Type', 'application/json').send({response: entity}).end();
      }
      else {
        res.status(404).set('Content-Type', 'application/json').send({response: null}).end();
      }
    });
});

app.get('/api/v1/employee', (req, res, next) => {
  if(!req.session || !req.session.userName) {
    res.status(401).set('Content-Type', 'application/json').send({message: "User not logged in."}).end();
    return;
  }
  if(!req.session.companyName) {
    res.status(404).set('Content-Type', 'application/json').send({message: "Not applicble to global admin."}).end();
    return;    
  }

  let namespace = req.session.companyName;
  let query = datastore
    .createQuery(namespace, 'Employee')
    //.limit(10)
    ;
  if(!req.session.enterpriseAdmin || req.session.enterpriseAdmin != "true") // Get current user for non-EnterpriseAdmin users
    query = query.filter('userName', '=', req.session.userName);
  else
    query = query.order('createdDate', {descending: true}) // TODO: Report bug. filter and order together do not work.

  //console.log('Running query', query);

  datastore.runQuery(query, (err, entities, info) => {
    if(err) {
      res.status(500).set('Content-Type', 'application/json').send({"message": "Unknown error ocurred. Internal Server Error", error: err}).end();
    }
    else {
      res.status(200).set('Content-Type', 'application/json').send({response: entities}).end();
    }
  });

});

app.post('/api/v1/faceFeatures', (req, res, next) => {
  if(!req.session || !req.session.userName) {
    res.status(401).set('Content-Type', 'application/json').send({message: "User not logged in."}).end();
    return;    
  }
  if(!req.session.companyName || req.session.enterpriseAdmin == "true" ) {
    res.status(404).set('Content-Type', 'application/json').send({message: "Not applicble to admin."}).end();
    return;    
  }
  let data = req.body;
  let companyName = req.session.companyName;
  let createdDate = Date.now();
  let entities = data.map((a) => {
    return { key: datastore.key({ namespace: companyName, path: ['FaceFeatures']}), 
               data: { name: a.name, features: a.features, gender: a.gender, gp: a.gp, age: a.age, createdDate: createdDate, creator: req.session.userName,
                       imgData: a.imgData, model: a.model, excludeFromIndexes: ['imgData', 'features[]'] },
               excludeLargeProperties: true
            }
           
  });
  datastore.save(entities, (err, apiResponse) => {
    if(err) {
      res.status(500).set('Content-Type', 'application/json').send({"message": "Unknown error ocurred. Internal Server Error", error: err}).end();
    }
    else {
      res.status(200).set('Content-Type', 'application/json').send({response: entities.map((entity) => {return entity.data.name; })}).end();
    }
  });
});

app.get('/api/v1/faceFeatures', (req, res, next) => {
  if(!req.session || !req.session.userName) {
    res.status(401).set('Content-Type', 'application/json').send({message: "User not logged in."}).end();
    return;    
  }
  if(!req.session.companyName || req.session.enterpriseAdmin == "true" ) {
    res.status(404).set('Content-Type', 'application/json').send({message: "Not applicble to admin."}).end();
    return;    
  }
  let namespace = req.session.companyName;
  let query = datastore
    .createQuery(namespace, 'FaceFeatures')
    .order('createdDate', {descending: true})
    //.limit(10)
    ;
  datastore.runQuery(query, (err, entities, info) => {
    if(err) {
      res.status(500).set('Content-Type', 'application/json').send({"message": "Unknown error ocurred. Internal Server Error", error: err}).end();
    }
    else {
      res.status(200).set('Content-Type', 'application/json').send({response: entities}).end();
    }
  });

});

const PORT = process.env.PORT || 8080;
const env = process.env.NODE_ENV;

app.listen(process.env.PORT || 8080, () => {
  console.log(`App listening on port ${PORT} environment ${env}`);
  console.log('Press Ctrl+C to quit.');
});
// [END gae_flex_datastore_app]

module.exports = app;

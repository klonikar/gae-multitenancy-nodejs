# Using Cloud Datastore

An App Engine project based on sample guestbook project by Google AppEngine using NodeJS, and the Cloud Datastore API via
[google-cloud-nodejs](https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/master/appengine/datastore)

## Setup
First, pick a project ID. You can create a project in the [Cloud Console] if you'd like, though this
isn't necessary unless you'd like to deploy the sample.

Then start the [Cloud Datastore Emulator](https://cloud.google.com/datastore/docs/tools/datastore-emulator):

    gcloud beta emulators datastore start --project=YOUR_PROJECT_ID_HERE

Or run

    npm start_datastore_emulator


Finally, in a new shell, [set the Datastore Emulator environmental variables](https://cloud.google.com/datastore/docs/tools/datastore-emulator#setting_environment_variables)

and run

## Running locally

    $(gcloud beta emulators datastore env-init)
    npm start_local

To run locally but against cloud datastore,

    $(gcloud beta emulators datastore env-unset)
    npm start

Testing on local project: [test_apis.html](http://localhost:8080/test_apis.html).

## Deploying to App Engine standard environment

	gcloud app deploy app.standard.yaml

## Deploying to App Engine flexible environment

	gcloud app deploy app.flexible.yaml

Testing on deployed project: [test_apis.html](https://rocketvision.appspot.com/test_apis.html).


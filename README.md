# Firebase's Cloud Function with NodeJs Sample
This is a Cloud Function in GCP created to transfer with 3 functions (made in NodeJs):
- Function 1: `onCreate` Event from Firebase Realtime Database that sends a message request to Firebase Cloud Messaging Service (FCM).
- Function 2: `schedule` function with a CRON notation that sends a message request to FCM.
- Function 3: `onUpdate` Event from Firebase Realtime Database that sends a message request to Firebase Cloud Messaging Service (FCM).

Steps to create:

1- Install Firebase Client (this example is on a MacOS terminal)
```bash
npm install -g firebase-tools
```

2- Now, Login into your Firebase account
```bash
firebase login
```
*Follow the prompts*

3- Start the wizard to create the Firebase's Cloud Functions project
```bash
firebase init functions
```
*Choose the project you want to use from Firebase (first you must have one project created in Firebase Website)*
*Choose a language*

4- You can access with the Text/Code Editor that you prefer.

5- To deploy your Cloud Function you can use the `deploy` command.
```bash
firebase deploy --only functions
```

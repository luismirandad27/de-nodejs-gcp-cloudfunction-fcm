/**
 * Class: index.js
 *
 * Main javascript the will create/update the Google Cloud Functions for the CoachMe Android APP Notifications 
 *
 * This Js file will hold the following Cloud Functions
 * 1. CoachMePushNotifOrder -> this method will send a Firebase Cloud Messaging (FCM) message to the customer
 * (defined by the Device Token) after the user pays for the order (onCreate event).
 * 
 * For this one, the cloud function will be triggered every time a new row in the orderNotifications
 * table from the CoachMe Firebase Database has been inserted.
 * 
 * 2. CoachMePushNotifAppReminder -> this method will send a Firebase Cloud Messaging (FCM) message to the customer
 * (defined by the Device Token) only on the day that the appointment will occur.
 * 
 * This cloud function works as a cron job that will be triggered every day at 6 am. If there is any reminder
 * from the appointmentReminders table from the CoachMe Firebase Database and the bookedDate matched with the current Date,
 * the message must be send to FCM and then to the customer.
 *
 * @author Luis Miguel Miranda
 * @version 1.0
 */

const functions = require("firebase-functions");
const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

//Initializing the Firebase App
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://w23-g3-coachme-default-rtdb.firebaseio.com"
});

//Cloud Function 1: Order Notifications
exports.CoachMePushNotifOrder = functions.database.ref("/orderNotifications/{orderId}")
  .onCreate(async (snapshot, context) => {

    const orderId = context.params.orderId;
    var orderNotification = snapshot.val();

    // Send a message to the user via Firebase Cloud Messaging
    const message = {
      notification: {
        title: orderNotification.title,
        body: orderNotification.description
      },
      token: orderNotification.deviceToken
    };

    return admin.messaging().send(message)
      .then((response) => {
        console.log('Successfully sent message:', response);
        const notifTriggersRef = admin.database().ref("/orderNotifications").child(orderId);
        return notifTriggersRef.remove()
          .then(() => {
            console.log('Trigger deleted');
          })
          .catch((error) => {
            console.error('Trigger not deleted');
          });

      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
  });

//Cloud Function 2: Appointment Reminder
exports.CoachMePushNotifAppReminder = functions.pubsub.schedule('0 6 * * *').onRun(async (context) => {
  // Get the current date
  const currentDate = new Date();
  // Set the start time to the beginning of the current day
  const startTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  // Set the end time to the end of the current day
  const endTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);

  // Get the reference to appointments
  const appRef = admin.database().ref("/appointmentReminders");
  // Query appointments for the current day
  const query = appRef.orderByChild("bookedDate").startAt(startTime.getTime()).endAt(endTime.getTime());

  const appointmentsSnapshot = await query.once('value');
  const appointments = appointmentsSnapshot.val();
  const promises = Object.keys(appointments).map(async (appointmentId) => {
    const appointment = appointments[appointmentId];
    const payload = {
      notification: {
        title: appointment.title,
        body: appointment.description,
      },
      token: appointment.deviceToken, 
    };

    const response = await admin.messaging().send(payload);
    console.log(`Notification sent for appointment ${appointmentId}:`, response);
  });

  await Promise.all(promises);
  console.log('Process finished!');

});

//Cloud Function 3: Appoinment Updated by the Trainer
exports.CoachMePushNotifStartAppointment = functions.database.ref("/appointments/{appointmentId}")
  .onUpdate(async (change,context) => {

      const appointmentId = context.params.appointmentId;
      var appointmentInfo = change.after.val();

      console.log(appointmentInfo.deviceToken);

      if(appointmentInfo.status == 4){
          //Send message to Firebase Cloud Messaging
          const message = {
            notification: {
              title: "Your appointment has started!",
              body: "Train with purpose! Your training session has just started. Let's make it count!"
            },
            data: {
              appId: appointmentId,
              status: "4"
            },
            token: appointmentInfo.deviceToken
          }

          return admin.messaging().send(message)
          .then((response) => {
            console.log('Successfully sent message:', response);
          })
          .catch((error) => {
            console.log('Error sending message:', error);
          });
      }
      else if(appointmentInfo.status == 5){
        //Send message to Firebase Cloud Messaging
        const message = {
          notification: {
            title: "Training Session Finished!",
            body: "Great job! You've finished your training session workout. We hope you feel great and proud of your accomplishments :)"
          },
          data: {
            appId: appointmentId,
            status: "5"
          },
          token: appointmentInfo.deviceToken
        }
        return admin.messaging().send(message)
        .then((response) => {
          console.log('Successfully sent message:', response);
        })
        .catch((error) => {
          console.log('Error sending message:', error);
        });
    }else{
        console.log('The appointment changed to a different status than 4');
      }

  });


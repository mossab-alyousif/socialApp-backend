const admin = require('firebase-admin');

var serviceAccount = require('../socialapp-a2f83-firebase-adminsdk-j7isp-5b5705c647.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://socialapp-a2f83.firebaseio.com',
  storageBucket: 'socialapp-a2f83.appspot.com'
});

const db = admin.firestore();
module.exports = { admin, db };

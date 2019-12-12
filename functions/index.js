const functions = require('firebase-functions');
const app = require('express')();
const firebaseAuth = require('./util/firebaseAuth');
const { db } = require('./util/admin');
const {
  getAllPosts,
  addPost,
  getPost,
  addComment,
  likePost,
  unlikePost,
  deletePost
} = require('./handlers/posts');
const {
  login,
  signup,
  uploadImage,
  addUserDetails,
  getAuthenticatedUserInfo,
  getUserDetails,
  markNotificationsRead
} = require('./handlers/users');

//posts routes
app.get('/posts', getAllPosts);
//add post(body of the post) AuthenticatedUser token in the headers
app.post('/post', firebaseAuth, addPost);
app.get('/post/:postId', getPost);
app.delete('/post/:postId', deletePost);
app.get('/post/:postId/like', firebaseAuth, likePost);
app.get('/post/:postId/unlike', firebaseAuth, unlikePost);
app.post('/post/:postId/comment', firebaseAuth, addComment);
//TODO: delete comment

//users routes
//signup (userName,email, password,confirmPassword,handle)
app.post('/signup', signup);
//login (email,password)
app.post('/login', login);
//upload user image (image file ) and AuthenticatedUser token in the headers
app.post('/user/image', firebaseAuth, uploadImage);
//addUserDetails(optional:(bio,website,location) and AuthenticatedUser token in the headers
app.post('/user', firebaseAuth, addUserDetails);
//getAuthenticatedUser  AuthenticatedUser token in the headers
app.get('/user', firebaseAuth, getAuthenticatedUserInfo);
//getuserDetails (the user handle in the route)
app.get('/user/:handle', getUserDetails);
// markNotificationsRead (array of notificationsID) AuthenticatedUser token in the headers
app.post('/notifications', firebaseAuth, markNotificationsRead);

exports.api = functions.region('asia-east2').https.onRequest(app);

exports.createNotificationOnLike = functions
  .region('asia-east2')
  .firestore.document('likes/{id}')
  .onCreate(snapshot => {
    return db
      .doc(`/posts/${snapshot.data().postId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            postId: doc.id
          });
        }
      })
      .catch(err => {
        console.log(err);
      });
  });

exports.createNotificationOnComment = functions
  .region('asia-east2')
  .firestore.document('comments/{id}')
  .onCreate(snapshot => {
    return db
      .doc(`/posts/${snapshot.data().postId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            read: false,
            postId: doc.id,
            type: 'comment',
            createdAt: new Date().toISOString()
          });
        }
      })
      .catch(err => {
        console.log(err);
        return;
      });
  });

exports.deleteNotificationOnUnLike = functions
  .region('asia-east2')
  .firestore.document('likes/{id}')
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.data().postId}`)
      .delete()
      .catch(err => {
        console.log(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region('asia-east2')
  .firestore.document('/users/{userId}')
  .onUpdate(change => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log('image has changed');
      const batch = db.batch();
      return db
        .collection('posts')
        .where('userHandle', '==', change.before.data().handle)
        .get()
        .then(data => {
          data.forEach(doc => {
            const post = db.doc(`/posts/${doc.id}`);
            batch.update(post, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onPostDelete = functions
  .region('asia-east2')
  .firestore.document('/psots/{postId}')
  .onDelete((snapshot, context) => {
    const postId = context.params.postId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('postId', '==', postId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection('likes')
          .where('postId', '==', postId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection('notifications')
          .where('postId', '==', postId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => console.error(err));
  });

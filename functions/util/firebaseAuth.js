const { admin, db } = require('./admin');

//this is a middleware to authenticate user
module.exports = (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('bearer ')
  ) {
    idToken = req.headers.authorization.split('bearer ')[1];
  } else {
    console.error('token not found');
    return res.status(403).json({ error: 'Unauthorized' });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      console.log(decodedToken);
      return db
        .collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
      req.user.handle = data.docs[0].data().handle;
      req.user.userName = data.docs[0].data().userName;
      req.user.imageUrl = data.docs[0].data().imageUrl;
      return next();
    })
    .catch(err => {
      console.error('error while verfing token ', err);
      return res.status(403).json(err);
    });
};

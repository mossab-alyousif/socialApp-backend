const { db } = require('../util/admin');

exports.getAllPosts = (req, res) => {
  db.collection('posts')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let posts = [];
      data.forEach(doc => {
        posts.push({
          postId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          userName: doc.data().userName,
          createdAt: doc.data().createdAt,
          userImage: doc.data().userImage
        });
      });
      return res.json(posts);
    })
    .catch(err => console.log(err));
};
exports.getPost = (req, res) => {
  let postData = {};
  db.doc(`/posts/${req.params.postId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'post not found' });
      }
      postData = doc.data();
      postData.postId = doc.id;
      return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('postId', '==', req.params.postId)
        .get();
    })
    .then(data => {
      postData.comments = [];
      data.forEach(doc => {
        postData.comments.push(doc.data());
      });
      return res.json(postData);
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.addPost = (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({ body: 'must not be empty' });
  }
  const newPost = {
    body: req.body.body,
    userHandle: req.user.handle,
    userName: req.user.userName,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0
  };
  db.collection('posts')
    .add(newPost)
    .then(doc => {
      let responsePost = newPost;
      responsePost.id = doc.id;
      res.json(responsePost);
    })
    .catch(err => {
      res.status(500).json({ error: 'somthing wrong ' });
      console.error(err);
    });
};
exports.addComment = (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({ comment: 'must not be empty' });
  }
  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    postId: req.params.postId,
    userHandle: req.user.handle,
    userName: req.user.userName,
    userImage: req.user.imageUrl
  };

  db.doc(`/posts/${req.params.postId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'post not found' });
      }
      return doc.ref.update({ commentsCount: doc.data().commentsCount + 1 });
    })
    .then(() => {
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch(err => {
      console.log(err);
      return res.json({ error: err.code });
    });
};

exports.likePost = (req, res) => {
  //check if the like document(check for the userhandle and postID)  exists
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('postId', '==', req.params.postId)
    .limit(1);

  //get the requested post
  const postDocument = db.doc(`/posts/${req.params.postId}`);
  let postData;

  postDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        postData = doc.data();
        postData.postId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'post not found' });
      }
    })
    .then(data => {
      if (data.empty) {
        db.collection('likes')
          .add({
            postId: req.params.postId,
            userHandle: req.user.handle
          })
          .then(() => {
            postData.likesCount++;
            return postDocument.update({ likesCount: postData.likesCount });
          })
          .then(() => {
            return res.json(postData);
          });
      } else {
        return res.status(400).json({ error: 'post already liked' });
      }
    })
    .catch(err => {
      console.log(err);
      return res.json({ error: err.code });
    });
};
exports.unlikePost = (req, res) => {
  //check if the like document(check for the userhandle and postID)  exists
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('postId', '==', req.params.postId)
    .limit(1);

  //get the requested post
  const postDocument = db.doc(`/posts/${req.params.postId}`);
  let postData;

  postDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        postData = doc.data();
        postData.postId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'post not found' });
      }
    })
    .then(data => {
      if (!data.empty) {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            postData.likesCount--;
            return postDocument.update({ likesCount: postData.likesCount });
          })
          .then(() => {
            return res.json(postData);
          });
      } else {
        return res.status(404).json({ error: 'not liked' });
      }
    })
    .catch(err => {
      console.log(err);
      return res.json({ error: err.code });
    });
};

exports.deletePost = (req, res) => {
  //get the post document
  const document = db.doc(`/posts/${req.params.postId}`);
  document
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ message: 'post not found' });
      }
      if (doc.data().userHandle !== req.params.handle) {
        return document.delete();
      } else {
        return res.status(400).json({ error: 'unauthoraized' });
      }
    })
    .then(() => {
      res.json({ message: 'post deleted successfully' });
    })
    .catch(err => {
      console.log(err);
      return res.json({ error: err.code });
    });
};

exports.isEmpty = string => {
  if (string.trim() === '') return true;
  else return false;
};

exports.isEmail = email => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegEx)) return true;
  else return false;
};

exports.validateSignupData = newUser => {
  let errors = {};

  if (this.isEmpty(newUser.email)) {
    errors.email = 'must not be empty';
  } else if (!this.isEmail(newUser.email)) {
    errors.email = 'must be a valid email';
  }

  if (this.isEmpty(newUser.password)) errors.password = 'must not be empty';
  else if (newUser.password !== newUser.confirmPassword) {
    errors.confirmPassword = 'passwords must matched';
  }

  if (this.isEmpty(newUser.handle)) errors.handle = 'must not be empty';
  if (this.isEmpty(newUser.userName)) errors.userName = 'must not be empty';
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.validateLoginData = user => {
  let errors = {};
  if (this.isEmpty(user.email)) errors.email = 'must not be empty';
  if (this.isEmpty(user.password)) errors.password = 'must not be empty';
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.reduceUserDetails = data => {
  let userDetails = {};

  if (!this.isEmpty(data.bio.trim())) userDetails.bio = data.bio;
  if (!this.isEmpty(data.website.trim())) {
    // https://website.com
    if (data.website.trim().substring(0, 4) !== 'http') {
      userDetails.website = `http://${data.website.trim()}`;
    } else userDetails.website = data.website;
  }
  if (!this.isEmpty(data.location.trim())) userDetails.location = data.location;

  return userDetails;
};

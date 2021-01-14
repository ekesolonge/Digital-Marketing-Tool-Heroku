require("dotenv").config();
const connection = require("../models/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const defaultRole = require("../middleware/defaultRole");
const Joi = require("joi"); // validator
const logTrail = require("../middleware/auditTrail");
const sendMail = require("../middleware/mailer");
const randomstring = require("randomstring");

// GET USERS
const getUsers = (req, res, next) => {
  connection.query(
    `select users.id,user_role.roleId,role.roleName, firstName, lastName, username,tel,email,website,picture,otp,isEnabled,users.dateCreated from users inner join user_role on users.id = user_role.userId INNER join role on role.id = user_role.roleId`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");
      res.send(resp);
    }
  );
};

// GET USERS BY ID
const getUserById = (req, res, next) => {
  connection.query(
    `select users.id,user_role.roleId,role.roleName, firstName, lastName, username,tel,email,website,picture,otp,isEnabled,users.dateCreated from users inner join user_role on users.id = user_role.userId INNER join role on role.id = user_role.roleId where users.id = ${req.params.id}`,
    (err, resp) => {
      if (err || resp.length < 1)
        return res.status(404).send("Record does not exist.");
      res.send(resp[0]);
    }
  );
};

// DELETE USERS
const deleteUser = (req, res, next) => {
  connection.query(
    `delete from users where id = ${req.params.id}`,
    (err, resp) => {
      if (resp.affectedRows < 1)
        return res.status(400).send("Record doesn't exist");
      if (err) return res.status(400).send("Internal Server Error");
      res.send("User successfully deleted.");

      // Audit Trail
      let trail = {
        actor: req.user.data.username,
        action: `deleted a user`,
        type: "warning",
      };
      logTrail(trail);
    }
  );
};

// CREATE A NEW USER (ADMIN)
const createUser = (req, res, next) => {
  // Joi validation
  const { error } = validateSignup(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let {
    firstName,
    lastName,
    username,
    tel,
    email,
    password,
    website,
    picture,
  } = req.body;

  if (!website) website = "";
  if (!tel) tel = "";
  if (!picture) picture = "";

  // Checks if user already exists
  connection.query(
    `select * from users where username = '${username}' OR email = '${email}'`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");

      if (resp.length > 0) {
        if (username === resp[0].username)
          return res.status(409).send("Username has already been taken");
        if (email === resp[0].email)
          return res.status(409).send("Email has already been taken");
      } else {
        // Hash password
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) return res.status(400).send("Internal Server Error");

          // INSERT into database
          connection.query(
            `insert into users (firstName,lastName,username,tel,email,password,website,picture,isEnabled) values
              ('${firstName}',
              '${lastName}',
              '${username}',
              '${tel}',
              '${email.toLowerCase()}',
              '${hash}',
              '${website}',
              '${picture}',
              'true')`,
            (error, resp2) => {
              if (error) return res.status(400).send("Internal Server Error");
              res.send("User successfully created.");
              defaultRole(resp2.insertId); // assigns user role to new users
              res.end();

              // Audit Trail
              let trail = {
                actor: req.user.data.username,
                action: `created a new user`,
                type: "success",
              };
              logTrail(trail);
            }
          );
        });
      }
    }
  );
};

// EDIT USER (ADMIN)
const editUser = (req, res, next) => {
  let {
    firstName,
    lastName,
    username,
    tel,
    email,
    password,
    website,
    picture,
  } = req.body;

  connection.query(
    `SELECT * FROM users WHERE id=${req.params.id}`,
    (err, db_res) => {
      if (err) {
        res.status(400).send("Internal Server Error");
      } else if (db_res.length < 1) {
        res.status(404).send(`Error! User does not exist.`);
      } else {
        let users = db_res;
        if (firstName == undefined) firstName = users[0].firstName;

        if (lastName == undefined) lastName = users[0].lastName;

        if (username == undefined) username = users[0].username;

        if (tel == undefined) tel = users[0].tel;

        if (email == undefined) email = users[0].email;

        if (password == undefined) password = users[0].password;

        if (website == undefined) website = users[0].website;

        if (picture == undefined) picture = users[0].picture;

        // Hash password
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) return res.status(400).send("Internal Server Error");

          // Store Path of image uploaded
          var filePath;
          if (req.file) {
            filePath = req.file.path.split("\\").join("/");
          } else {
            filePath = users[0].picture;
          }

          let sql = `update users set firstName = '${firstName}', lastName = '${lastName}',username = '${username}',tel = '${tel}',email = '${email.toLowerCase()}',password = '${hash}',website = '${website}',picture = '${filePath}' where id = ${
            req.params.id
          }`;
          connection.query(sql, (err, db_res) => {
            if (err) return res.status(400).send("Internal Server Error");
            res.send(`User Updated Successfully.`);

            // Audit Trail
            let trail = {
              actor: req.user.data.username,
              action: `Edited a user`,
              type: "success",
            };
            logTrail(trail);
          });
        });
      }
    }
  );
};

// Update Profile
const updateProfile = (req, res, next) => {
  let {
    firstName,
    lastName,
    username,
    tel,
    email,
    password,
    website,
    picture,
  } = req.body;

  connection.query(
    `SELECT * FROM users WHERE id=${req.user.data.userId}`,
    (err, db_res) => {
      if (err) {
        res.status(400).send("Internal Server Error");
      } else if (db_res.length < 1) {
        res.status(404).send(`Error! User does not exist.`);
      } else {
        let users = db_res;
        if (firstName == undefined) firstName = users[0].firstName;

        if (lastName == undefined) lastName = users[0].lastName;

        if (username == undefined) username = users[0].username;

        if (tel == undefined) tel = users[0].tel;

        if (email == undefined) email = users[0].email;

        if (password == undefined) password = users[0].password;

        if (website == undefined) website = users[0].website;

        if (picture == undefined) picture = users[0].picture;

        // Hash password
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) return res.status(400).send("Internal Server Error");

          // Store Path of image uploaded
          var filePath;
          if (req.file) {
            filePath = req.file.path.split("\\").join("/");
          } else {
            filePath = users[0].picture;
          }

          let sql = `update users set firstName = '${firstName}', lastName = '${lastName}',username = '${username}',tel = '${tel}',email = '${email.toLowerCase()}',password = '${hash}',website = '${website}',picture = '${filePath}' where id = ${
            req.user.data.userId
          }`;
          connection.query(sql, (err, db_res) => {
            if (err) return res.status(400).send("Internal Server Error");
            res.send(`Profile Updated Successfully.`);

            // Audit Trail
            let trail = {
              actor: req.user.data.username,
              action: `updated profile`,
              type: "success",
            };
            logTrail(trail);
          });
        });
      }
    }
  );
};

// SIGNUP
const signup = (req, res, next) => {
  // Joi validation
  const { error } = validateSignup(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let {
    firstName,
    lastName,
    username,
    tel,
    email,
    password,
    website,
    picture,
    otp,
  } = req.body;

  if (!website) website = "";
  if (!tel) tel = "";
  if (!picture) picture = "";

  // Checks if user already exists
  connection.query(
    `select * from users where username = '${username}' OR email = '${email}'`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");

      if (resp.length > 0) {
        if (username === resp[0].username)
          return res.status(409).send("Username has already been taken");
        if (email === resp[0].email)
          return res.status(409).send("Email has already been taken");
      } else {
        // Hash password
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) return res.status(400).send("Internal Server Error");

          const otpCode = randomstring.generate();

          // INSERT into database
          connection.query(
            `insert into users (firstName,lastName,username,tel,email,password,website,picture,otp,isEnabled) values
              ('${firstName}',
              '${lastName}',
              '${username}',
              '${tel}',
              '${email.toLowerCase()}',
              '${hash}',
              '${website}',
              '${picture}',
              '${otpCode}',
              'false')`,
            (error, resp2) => {
              if (error) return res.status(400).send("Internal Server Error");

              const encodedUserId = encodeURIComponent(
                Buffer.from(`${resp2.insertId}`, "binary").toString("base64")
              );
              const encodedOtpCode = encodeURIComponent(
                Buffer.from(`${otpCode}`, "binary").toString("base64")
              );

              sendMail(
                "MartReach Admin <martreach2@gmail.com>",
                "User Registration Successful! Please, Activate Your Account!",
                `${req.body.email}`,
                `Hi ${req.body.firstName}, <br/>
                        <p>Welcome to <b>MartReach</b>, thank you for your registration. Click <a href="${process.env.BASE_URL}/api/users/auth/activation/${encodedUserId}/${encodedOtpCode}"><b>here</b></a> to activate your account.
                        <p>Or Copy the link below to your browser:<br/>
                        <a href="${process.env.BASE_URL}/api/users/auth/activation/${encodedUserId}/${encodedOtpCode}">${process.env.BASE_URL}/api/users/auth/activation/${encodedUserId}/${encodedOtpCode}}</a></p>
                        <br/>`,
                (err3, info) => {
                  if (err3)
                    return res.status(500).send("Internal Server Error");
                  res
                    .status(201)
                    .send(
                      "Signup Successful! Please, check your mail and activate your account!"
                    );
                  defaultRole(resp2.insertId);

                  // Audit Trail
                  let trail = {
                    actor: username,
                    action: `new user signup`,
                    type: "success",
                  };
                  logTrail(trail);
                }
              );
            }
          );
        });
      }
    }
  );
};

// LOGIN
const login = (req, res, next) => {
  connection.query(
    `SELECT * FROM users inner join user_role on users.id = user_role.userId WHERE username='${req.body.username}'`,
    async (err, resp) => {
      if (err || resp.length < 1) {
        res.statusCode = 401;
        res.send("Invalid username and password.");
      } else if (resp[0].isEnabled == "true") {
        var result = await bcrypt.compare(req.body.password, resp[0].password);
        if (result === false) {
          res.statusCode = 401;
          res.send("Invalid username and password");

          // Audit Trail
          let trail = {
            actor: "anonymous",
            action: `anonymous user: ${req.body.username} failed login attempt`,
            type: "danger",
          };
          logTrail(trail);
        } else {
          // Check permissions
          connection.query(
            `select permissionName,groupName from permission inner join role_permission on permission.id = role_permission.permissionId where role_permission.roleId = ${resp[0].roleId}`,
            (err, resPerm) => {
              if (err) return res.status(400).send("Internal Server Error");
              resp[0].permissions = resPerm;
              delete resp[0].password;

              // Token logic
              let data = { data: resp[0] };
              let token = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: process.env.ACCESS_TOKEN_LIFE,
              });
              let tokenData = {
                data: resp[0],
                accessToken: token,
              };
              res.send(tokenData);

              // Audit Trail
              let trail = {
                actor: req.body.username,
                action: `successful login`,
                type: "success",
              };
              logTrail(trail);
            }
          );
        }
      } else {
        res
          .status(401)
          .send(
            `Account not activated! Please, check your mail or request for another activation link here`
          );
      }
    }
  );
};

// Reset Password
const resetPassword = (req, res, next) => {
  connection.query(
    `SELECT * FROM users WHERE email = '${req.body.email}'`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");
      if (resp.length < 1)
        return res.status(422).json({ message: "invalid email supplied" });
      else {
        const otpCode = randomstring.generate();
        connection.query(
          `UPDATE users SET otp = '${otpCode}' WHERE id = ${resp[0].id}`,
          (err2, resp2) => {
            const encodedUserId = encodeURIComponent(
              Buffer.from(`${resp[0].id}`, "binary").toString("base64")
            );
            const encodedOtpCode = encodeURIComponent(
              Buffer.from(`${otpCode}`, "binary").toString("base64")
            );
            sendMail(
              "MartReach Admin <martreach2@gmail.com>",
              "Request to reset password, MartReach",
              `${resp[0].email}`,
              `Hi ${resp[0].firstName}, <br/>
                    <p>A request was initiated to reset your password. Click <a href="${process.env.BASE_URL}/api/users/auth/reset/${encodedUserId}/${encodedOtpCode}"><b>here</b></a> on the button below to reset your account password.</p>
                    <p>Or Copy the link below to your browser:<br/>
                    <a href="${process.env.BASE_URL}/api/users/auth/reset/${encodedUserId}/${encodedOtpCode}">${process.env.BASE_URL}/api/users/auth/reset/${encodedUserId}/${encodedOtpCode}</a></p>
                    <br/>
                    Please, ignore and this mail if you did not make the request! Thanks.`,
              (err3, info) => {
                if (err3) return res.status(500).send("Internal Server Error");
                res
                  .status(200)
                  .send(
                    "Password reset requested! Please, check your mail and reset your password!"
                  );
                // Audit Trail
                let trail = {
                  actor: resp[0].username,
                  action: `Password reset requested`,
                  type: "warning",
                };
                logTrail(trail);
              }
            );
          }
        );
      }
    }
  );
};

// Handle Password Reset
const handleResetPassword = (req, res) => {
  const decodedUserId = decodeURIComponent(req.params.userId);
  const decodedOtpCode = decodeURIComponent(req.params.otpCode);

  const userId = Buffer.from(decodedUserId, "base64").toString();
  const otpCode = Buffer.from(decodedOtpCode, "base64").toString();

  connection.query(
    `SELECT email, otp, isEnabled FROM users WHERE id = ${userId}`,
    (err, resp) => {
      if (err) {
        return res.status(400).send("Internal Server Error");
      }
      if (resp.length > 0) {
        if (resp[0].otp == otpCode) {
          return res
            .status(200)
            .json({ userId: userId, status: "Verified", otp: otpCode });
        } else {
          return res.status(401).json({ message: "Error resetting password!" });
        }
      } else {
        return res.status(404).json({ message: "No user found!" });
      }
    }
  );
};

// Set New Password from Reset
const setPassword = (req, res) => {
  let { userId, newPassword, otpCode } = req.body;

  connection.query(
    `SELECT email, otp FROM users WHERE id = ${userId}`,
    (err, resp) => {
      if (err) {
        return res.status(422).json({ message: "Internal Error!" });
      }
      if (resp.length > 0) {
        if (resp[0].otp == otpCode) {
          // Hash password
          bcrypt.hash(newPassword, 10, (err, hash) => {
            connection.query(
              `UPDATE users SET otp = null, password = '${hash}' WHERE id = ${userId}`,
              (err2, resp2) => {
                if (err2)
                  return res.status(422).json({ message: "Internal error" });
                res.status(200).send("Password reset successful");
                // Audit Trail
                let trail = {
                  actor: resp[0].username,
                  action: `Password reset successful`,
                  type: "success",
                };
                logTrail(trail);
              }
            );
          });
        } else {
          return res.status(401).json({
            message: "Error resetting password! Please check the link again",
          });
        }
      } else {
        return res
          .status(404)
          .json({ message: "No account found! Check  Link Again" });
      }
    }
  );
};

// Activate User Account
const activateAccount = (req, res) => {
  const decodedUserId = decodeURIComponent(req.params.userId);
  const decodedOtpCode = decodeURIComponent(req.params.otpCode);

  const userId = Buffer.from(decodedUserId, "base64").toString();
  const otpCode = Buffer.from(decodedOtpCode, "base64").toString();

  connection.query(
    `SELECT email, otp, isEnabled FROM users WHERE id = ${userId}`,
    (err, resp) => {
      if (err) {
        return res.status(422).json({ message: "Internal Error!" });
      }
      if (resp.length > 0) {
        if (resp[0].isEnabled == "true") {
          return res
            .status(200)
            .redirect(
              "https://md-ameenu.github.io/DIGITAL-MARKETING-TOOL-REACT-MIGRATION-/#/"
            );
        }
        if (resp[0].otp == otpCode) {
          connection.query(
            `UPDATE users SET isEnabled = 'true', otp = null WHERE id = ${userId}`,
            (err2, resp2) => {
              if (err2) {
                return res.status(422).json({ message: "Internal error" });
              }
              res
                .status(200)
                .redirect(
                  "https://md-ameenu.github.io/DIGITAL-MARKETING-TOOL-REACT-MIGRATION-/#/"
                );
              // Audit Trail
              let trail = {
                actor: resp[0].username,
                action: `User account activated`,
                type: "success",
              };
              logTrail(trail);
            }
          );
        } else {
          return res.status(401).json({
            message: "Error validating account! Please check the link again",
          });
        }
      } else {
        return res
          .status(404)
          .json({ message: "No account found! Check Activation Link Again" });
      }
    }
  );
};

// Joi validation function
function validateSignup(signup) {
  const pattern =
    "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$";

  const schema = Joi.object({
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    username: Joi.string().min(5).required(),
    tel: Joi.string().empty("").min(11).max(16),
    password: Joi.string()
      .required()
      .min(8)
      .max(20)
      .regex(RegExp(pattern))
      .messages({
        "string.min": `password should have a minimum length of {#limit}`,
        "string.max": `password should have a maximum length of {#limit}`,
        "any.required": `password is a required field`,
        "string.pattern.base": `password should contain at least one uppercase letter, one lowercase letter, one number and one special character`,
      }),
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    }),
  });

  return schema.validate(signup);
}

// Export functions
module.exports.getUsers = getUsers;
module.exports.getUserById = getUserById;
module.exports.deleteUser = deleteUser;
module.exports.createUser = createUser;
module.exports.editUser = editUser;
module.exports.updateProfile = updateProfile;
module.exports.signup = signup;
module.exports.login = login;
module.exports.activateAccount = activateAccount;
module.exports.resetPassword = resetPassword;
module.exports.handleResetPassword = handleResetPassword;
module.exports.setPassword = setPassword;

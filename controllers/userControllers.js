require("dotenv").config();
const connection = require("../models/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const defaultRole = require("../middleware/defaultRole");
const Joi = require("joi"); // validator
const logTrail = require("../middleware/auditTrail");

// GET USERS
const getUsers = (req, res, next) => {
  connection.query(`select * from users`, (err, resp) => {
    if (err) throw err;
    resp.map((x) => delete x.password);
    res.send(resp);
  });
};

// GET USERS BY ID
const getUserById = (req, res, next) => {
  connection.query(
    `select * from users where id = ${req.params.id}`,
    (err, resp) => {
      if (err || resp.length < 1)
        return res.status(404).send("Record does not exist.");
      delete resp[0].password;
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
      if (err) return res.send(err);
      res.send("User successfully deleted at ID " + req.params.id);
    }
  );
};

// CREATE A NEW USER
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
      if (err) return res.status(400).send({ message: err.sqlMessage });

      if (resp.length > 0) {
        if (username === resp[0].username)
          return res.status(409).send("Username has already been taken");
        if (email === resp[0].email)
          return res.status(409).send("Email has already been taken");
      } else {
        // Hash password
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) return res.send(err);

          // INSERT into database
          connection.query(
            `insert into users (firstName,lastName,username,tel,email,password,website,picture,isEnabled) values
              ('${firstName}',
              '${lastName}',
              '${username}',
              '${tel}',
              '${email}',
              '${hash}',
              '${website}',
              '${picture}',
              'true')`,
            (error, resp2) => {
              if (error) return res.send(error.sqlMessage);
              res.send("User successfully created.");
              defaultRole(resp2.insertId); // assigns user role to new users
              res.end();
            }
          );
        });
      }
    }
  );
};

// EDIT USER
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
        res.send(err);
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
          if (err) return res.send(err);

          // Store Path of image uploaded
          var filePath;
          if (req.file) {
            filePath = req.file.path.split("\\").join("/");
          } else {
            filePath = users[0].picture;
          }

          let sql = `update users set firstName = '${firstName}', lastName = '${lastName}',username = '${username}',tel = '${tel}',email = '${email}',password = '${hash}',website = '${website}',picture = '${filePath}' where id = ${req.params.id}`;
          connection.query(sql, (err, db_res) => {
            if (err) return res.status(400).send(err);
            res.send(`User Updated Successfully at ID: ${req.params.id}!`);
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
  } = req.body;

  if (!website) website = "";
  if (!tel) tel = "";
  if (!picture) picture = "";

  // Checks if user already exists
  connection.query(
    `select * from users where username = '${username}' OR email = '${email}'`,
    (err, resp) => {
      if (err) return res.status(400).send({ message: err.sqlMessage });

      if (resp.length > 0) {
        if (username === resp[0].username)
          return res.status(409).send("Username has already been taken");
        if (email === resp[0].email)
          return res.status(409).send("Email has already been taken");
      } else {
        // Hash password
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) return res.send(err);

          // INSERT into database
          connection.query(
            `insert into users (firstName,lastName,username,tel,email,password,website,picture,isEnabled) values
              ('${firstName}',
              '${lastName}',
              '${username}',
              '${tel}',
              '${email}',
              '${hash}',
              '${website}',
              '${picture}',
              'true')`,
            (error, resp2) => {
              if (error) return res.send(error.sqlMessage);
              res.send("User successfully created.");
              defaultRole(resp2.insertId); // assigns user role to new users
              res.end();
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
    (err, resp) => {
      if (err || resp.length < 1) {
        res.statusCode = 401;
        res.send("Invalid username and password.");
      } else {
        bcrypt.compare(req.body.password, resp[0].password, (err, result) => {
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
          }
          if (result === true) {
            // Check permissions
            connection.query(
              `select permissionName,groupName from permission inner join role_permission on permission.permissionId = role_permission.permissionId where role_permission.roleId = ${resp[0].roleId}`,
              (err, resPerm) => {
                if (err) return res.status(401).send(err);
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

                let trail = {
                  actor: req.body.username,
                  action: `successful login`,
                  type: "success",
                };
                logTrail(trail);
              }
            );
          }
        });
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
module.exports.signup = signup;
module.exports.login = login;

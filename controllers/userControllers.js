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

          if (!password) password = hash;

          // Store Path of image uploaded
          var filePath;
          if (req.file) {
            filePath = req.filePath;
          } else {
            filePath = users[0].picture;
          }

          let sql = `update users set firstName = '${firstName}', lastName = '${lastName}',username = '${username}',tel = '${tel}',email = '${email.toLowerCase()}',password = '${password}',website = '${website}',picture = '${filePath}' where id = ${
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

          if (!password) password = hash;

          // Store Path of image uploaded
          var filePath;
          if (req.file) {
            filePath = req.filePath;
          } else {
            filePath = users[0].picture;
          }

          let sql = `update users set firstName = '${firstName}', lastName = '${lastName}',username = '${username}',tel = '${tel}',email = '${email.toLowerCase()}',password = '${password}',website = '${website}',picture = '${filePath}' where id = ${
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
                `<!DOCTYPE HTML
    PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
    xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
    <!--[if gte mso 9]><xml>  <o:OfficeDocumentSettings>    <o:AllowPNG/>    <o:PixelsPerInch>96</o:PixelsPerInch>  </o:OfficeDocumentSettings></xml><![endif]-->
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--<![endif]-->
    <title></title>
    <style type="text/css">
        a {
            color: #0000ee;
            text-decoration: underline;
        }

        @media only screen and (min-width: 620px) {
            .u-row {
                width: 600px !important;

            }

            .u-row .u-col {
                vertical-align: top;

            }

            .u-row .u-col-100 {
                width: 600px !important;

            }


        }

        @media (max-width: 620px) {
            .u-row-container {
                max-width: 100% !important;
                padding-left: 0px !important;
                padding-right: 0px !important;

            }

            .u-row .u-col {
                min-width: 320px !important;
                max-width: 100% !important;
                display: block !important;

            }

            .u-row {
                width: calc(100% - 40px) !important;

            }

            .u-col {
                width: 100% !important;

            }

            .u-col>div {
                margin: 0 auto;

            }

            .no-stack .u-col {
                min-width: 0 !important;
                display: table-cell !important;

            }

            .no-stack .u-col-100 {
                width: 100% !important;

            }


        }

        body {
            margin: 0;
            padding: 0;

        }

        table,
        tr,
        td {
            vertical-align: top;
            border-collapse: collapse;

        }

        p {
            margin: 0;

        }

        .ie-container table,
        .mso-container table {
            table-layout: fixed;

        }

        * {
            line-height: inherit;

        }

        a[x-apple-data-detectors='true'] {
            color: inherit !important;
            text-decoration: none !important;

        }

        @media (max-width: 480px) {
            .hide-mobile {
                display: none !important;
                max-height: 0px;
                overflow: hidden;

            }

            .hide-desktop {
                display: block !important;

            }


        }
    </style>
    <!--[if !mso]><!-->
    <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
    <!--<![endif]-->
</head>

<body class="clean-body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9">
    <!--[if IE]><div class="ie-container"><![endif]-->
    <!--[if mso]><div class="mso-container"><![endif]-->
    <table class="nl-container" style="border-collapse:
        collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align:
        top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
        <tbody>
            <tr style="vertical-align: top">
                <td style="word-break: break-word;border-collapse: collapse
                    !important;vertical-align: top">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->
                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                        <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap:
                            break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;"
                            class="u-row">
                            <div style="border-collapse: collapse;display: table;width:
                                100%;background-color: transparent;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->

                                <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display:
                                    table-cell;vertical-align: top;">
                                    <div style="width: 100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px
                                            solid transparent;border-right: 0px solid transparent;border-bottom: 0px
                                            solid transparent;">
                                            <!--<![endif]-->
                                            <table id="u_content_text_1" class="u_content_text"
                                                style="font-family:'Cabin',sans-serif;" role="presentation"
                                                cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;"
                                                            align="left">
                                                            <div class="v-text-align" style="color: #afb0c7; line-height: 170%; text-align:
                                                                center; word-wrap: break-word;">
                                                                <p style="font-size: 14px; line-height: 170%;"><span
                                                                        style="font-size: 14px; line-height:
                                                                        23.8px;">View Email in Browser</span></p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                    </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                            </div>
                        </div>
                    </div>
                    <div class="u-row-container" style="padding:
                        0px;background-color: transparent">
                        <div style="Margin: 0 auto;min-width: 320px;max-width:
                            600px;overflow-wrap: break-word;word-wrap: break-word;word-break:
                            break-word;background-color: #ffffff;" class="u-row">
                            <div style="border-collapse:
                                collapse;display: table;width: 100%;background-color: #ffffff;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->

                                <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display:
                                    table-cell;vertical-align: top;">
                                    <div style="width: 100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px
                                            solid transparent;border-right: 0px solid transparent;border-bottom: 0px
                                            solid transparent;">
                                            <!--<![endif]-->
                                            <table id="u_content_image_1" class="u_content_image"
                                                style="font-family:'Cabin',sans-serif;" role="presentation"
                                                cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;"
                                                            align="left">
                                                            <table width="100%" cellpadding="0" cellspacing="0"
                                                                border="0">
                                                                <tr>
                                                                    <td style="padding-right: 0px;padding-left: 0px;"
                                                                        align="center"> <img align="center" border="0"
                                                                            src="https://team2-digital-marketing-tool.netlify.app/images/MartReach%20logo.png"
                                                                            alt="Image" title="Image" style="outline: none;text-decoration:
                                                                            none;-ms-interpolation-mode: bicubic;clear:
                                                                            both;display: block !important;border:
                                                                            none;height: auto;float: none;width:
                                                                            32%;max-width: 179.2px;" width="179.2"
                                                                            class="v-src-width v-src-max-width" />
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                    </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                            </div>
                        </div>
                    </div>
                    <div class="u-row-container" style="padding:
                        0px;background-color: transparent">
                        <div style="Margin: 0 auto;min-width: 320px;max-width:
                            600px;overflow-wrap: break-word;word-wrap: break-word;word-break:
                            break-word;background-color: #8c30f5;" class="u-row">
                            <div style="border-collapse:
                                collapse;display: table;width: 100%;background-color: #8c30f5;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #8c30f5;"><![endif]-->

                                <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display:
                                    table-cell;vertical-align: top;">
                                    <div style="width: 100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px
                                            solid transparent;border-right: 0px solid transparent;border-bottom: 0px
                                            solid transparent;">
                                            <!--<![endif]-->
                                            <table id="u_content_image_2" class="u_content_image"
                                                style="font-family:'Cabin',sans-serif;" role="presentation"
                                                cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:40px
                                                            10px 10px;font-family:'Cabin',sans-serif;" align="left">
                                                            <table width="100%" cellpadding="0" cellspacing="0"
                                                                border="0">
                                                                <tr>
                                                                    <td style="padding-right: 0px;padding-left: 0px;"
                                                                        align="center"> <img align="center" border="0"
                                                                            src="https://cdn.templates.unlayer.com/assets/1597218650916-xxxxc.png"
                                                                            alt="Image" title="Image" style="outline: none;text-decoration:
                                                                            none;-ms-interpolation-mode: bicubic;clear:
                                                                            both;display: block !important;border:
                                                                            none;height: auto;float: none;width:
                                                                            26%;max-width: 150.8px;" width="150.8"
                                                                            class="v-src-width v-src-max-width" />
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <table id="u_content_text_3" class="u_content_text"
                                                style="font-family:'Cabin',sans-serif;" role="presentation"
                                                cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;"
                                                            align="left">
                                                            <div class="v-text-align" style="color: #e5eaf5; line-height: 140%; text-align:
                                                                center; word-wrap: break-word;">
                                                                <p style="font-size: 14px; line-height: 140%;">
                                                                    <strong>T H A N K S&nbsp; &nbsp;F O R&nbsp; &nbsp;S
                                                                        I G N I N G&nbsp; &nbsp;U P !</strong>
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <table id="u_content_text_4" class="u_content_text"
                                                style="font-family:'Cabin',sans-serif;" role="presentation"
                                                cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:0px
                                                            10px 31px;font-family:'Cabin',sans-serif;" align="left">
                                                            <div class="v-text-align" style="color: #e5eaf5;
                                                                line-height: 140%; text-align: center; word-wrap:
                                                                break-word;">
                                                                <p style="font-size: 14px;
                                                                    line-height: 140%;"><span style="font-size: 28px;
                                                                        line-height: 39.2px;"><strong><span style="line-height: 39.2px; font-size:
                                                                                28px;">Verify your Email
                                                                                Address</span></strong></span></p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                    </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                            </div>
                        </div>
                    </div>
                    <div class="u-row-container" style="padding:
                        0px;background-color: transparent">
                        <div style="Margin: 0 auto;min-width: 320px;max-width:
                            600px;overflow-wrap: break-word;word-wrap: break-word;word-break:
                            break-word;background-color: #ffffff;" class="u-row">
                            <div style="border-collapse:
                                collapse;display: table;width: 100%;background-color: #ffffff;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->

                                <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display:
                                    table-cell;vertical-align: top;">
                                    <div style="width: 100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px
                                            solid transparent;border-right: 0px solid transparent;border-bottom: 0px
                                            solid transparent;">
                                            <!--<![endif]-->
                                            <table id="u_content_text_6" class="u_content_text"
                                                style="font-family:'Cabin',sans-serif;" role="presentation"
                                                cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:33px
                                                            55px;font-family:'Cabin',sans-serif;" align="left">
                                                            <div class="v-text-align" style="color: #000000;
                                                                line-height: 160%; text-align: center; word-wrap:
                                                                break-word;">
                                                                <p style="font-size: 14px;
                                                                    line-height: 160%;"><span style="font-size: 22px;
                                                                        line-height: 35.2px;">Hi ${req.body.firstName},
                                                                    </span></p>
                                                                <p style="font-size: 14px; line-height: 160%;"><span
                                                                        style="font-size: 18px; line-height:
                                                                        28.8px;">You're almost ready to get started.
                                                                        Please click on the button below to verify your
                                                                        email address and proceed to login and enjoy using our MartReach
                                                                        services with us! </span></p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <table id="u_content_button_1" class="u_content_button"
                                                style="font-family:'Cabin',sans-serif;" role="presentation"
                                                cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;"
                                                            align="left">
                                                            <div class="v-text-align" align="center">
                                                                <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;font-family:'Cabin',sans-serif;"><tr><td class="v-text-align" style="font-family:'Cabin',sans-serif;" align="center"><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="baseurl" style="height:46px; v-text-anchor:middle; width:234px;" arcsize="8.5%" stroke="f" fillcolor="#8c30f5"><w:anchorlock/><center style="color:#ffffff;font-family:'Cabin',sans-serif;"><![endif]-->
                                                                <a href="${process.env.BASE_URL}/api/users/auth/activation/${encodedUserId}/${encodedOtpCode}"
                                                                    target="_blank" class="v-size-width" style="box-sizing:
                                                                    border-box;display:
                                                                    inline-block;font-family:'Cabin',sans-serif;text-decoration:
                                                                    none;-webkit-text-size-adjust: none;text-align:
                                                                    center;color: #ffffff; background-color: #8c30f5;
                                                                    border-radius: 4px; -webkit-border-radius: 4px;
                                                                    -moz-border-radius: 4px; width:auto; max-width:100%;
                                                                    overflow-wrap: break-word; word-break: break-word;
                                                                    word-wrap:break-word; mso-border-alt: none;">
                                                                    <span class="v-padding" style="display:block;padding:14px 44px
                                                                        13px;line-height:120%;"><span style="font-size: 16px; line-height:
                                                                            19.2px;"><strong><span style="line-height:
                                                                                    19.2px; font-size: 16px;">VERIFY
                                                                                    YOUR
                                                                                    EMAIL</span></strong></span></span>
                                                                </a>
                                                                <!--[if mso]></center></v:roundrect></td></tr></table><![endif]-->
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <table id="u_content_text_7" class="u_content_text"
                                                style="font-family:'Cabin',sans-serif;" role="presentation"
                                                cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:33px
                                                            55px 60px;font-family:'Cabin',sans-serif;" align="left">
                                                            <div class="v-text-align" style="color: #000000;
                                                                line-height: 160%; text-align: center; word-wrap:
                                                                break-word;">
                                                                <p style="line-height: 160%;
                                                                    font-size: 14px;"><span style="font-size: 18px;
                                                                        line-height: 28.8px;">Thanks,</span></p>
                                                                <p style="line-height: 160%; font-size: 14px;"><span
                                                                        style="font-size: 18px; line-height:
                                                                        28.8px;">MartReach Team</span></p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                    </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                            </div>
                        </div>
                    </div>
                    <div class="u-row-container" style="padding:
                        0px;background-color: transparent">
                        <div style="Margin: 0 auto;min-width: 320px;max-width:
                            600px;overflow-wrap: break-word;word-wrap: break-word;word-break:
                            break-word;background-color: #f1e4ff;" class="u-row">
                            <div style="border-collapse:
                                collapse;display: table;width: 100%;background-color: #f1e4ff;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #f1e4ff;"><![endif]-->

                                <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display:
                                    table-cell;vertical-align: top;">
                                    <div style="width: 100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px
                                            solid transparent;border-right: 0px solid transparent;border-bottom: 0px
                                            solid transparent;">
                                            <!--<![endif]-->
                                            <table id="u_content_text_5" class="u_content_text"
                                                style="font-family:'Cabin',sans-serif;" role="presentation"
                                                cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:41px
                                                            55px 18px;font-family:'Cabin',sans-serif;" align="left">
                                                            <div class="v-text-align" style="color: #8c30f5;
                                                                line-height: 160%; text-align: center; word-wrap:
                                                                break-word;">
                                                                <p style="font-size: 14px;
                                                                    line-height: 160%;"><span style="font-size: 20px;
                                                                        line-height: 32px;"><strong>Get in
                                                                            touch</strong></span></p>
                                                                <p style="font-size: 14px; line-height: 160%;"><span
                                                                        style="font-size: 16px; line-height: 25.6px;
                                                                        color: #000000;">+11 111 333 4444</span></p>
                                                                <p style="font-size: 14px; line-height: 160%;"><span
                                                                        style="font-size: 16px; line-height: 25.6px;
                                                                        color: #000000;">martreach2@gmail.com</span>
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <table id="u_content_social_1" class="u_content_social"
                                                style="font-family:'Cabin',sans-serif;" role="presentation"
                                                cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px
                                                            10px 33px;font-family:'Cabin',sans-serif;" align="left">
                                                            <div align="center">
                                                                <div style="display: table;
                                                                    max-width:244px;">
                                                                    <!--[if (mso)|(IE)]><table width="244" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:244px;"><tr><![endif]-->

                                                                    <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                                    <table align="left" border="0" cellspacing="0"
                                                                        cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout:
                                                                        fixed;border-spacing: 0;mso-table-lspace:
                                                                        0pt;mso-table-rspace: 0pt;vertical-align:
                                                                        top;Margin-right: 17px">
                                                                        <tbody>
                                                                            <tr style="vertical-align: top">
                                                                                <td align="left" valign="middle" style="word-break:
                                                                                    break-word;border-collapse: collapse
                                                                                    !important;vertical-align: top">
                                                                                    <a href="https://facebook.com/"
                                                                                        title="Facebook"
                                                                                        target="_blank"> <img
                                                                                            src="https://cdn.tools.unlayer.com/social/icons/circle-black/facebook.png"
                                                                                            alt="Facebook"
                                                                                            title="Facebook" width="32"
                                                                                            style="outline:
                                                                                            none;text-decoration:
                                                                                            none;-ms-interpolation-mode:
                                                                                            bicubic;clear: both;display:
                                                                                            block !important;border:
                                                                                            none;height: auto;float:
                                                                                            none;max-width: 32px
                                                                                            !important"> </a>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <!--[if (mso)|(IE)]></td><![endif]-->
                                                                    <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                                    <table align="left" border="0" cellspacing="0"
                                                                        cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout:
                                                                        fixed;border-spacing: 0;mso-table-lspace:
                                                                        0pt;mso-table-rspace: 0pt;vertical-align:
                                                                        top;Margin-right: 17px">
                                                                        <tbody>
                                                                            <tr style="vertical-align: top">
                                                                                <td align="left" valign="middle" style="word-break:
                                                                                    break-word;border-collapse: collapse
                                                                                    !important;vertical-align: top">
                                                                                    <a href="https://linkedin.com/"
                                                                                        title="LinkedIn"
                                                                                        target="_blank"> <img
                                                                                            src="https://cdn.tools.unlayer.com/social/icons/circle-black/linkedin.png"
                                                                                            alt="LinkedIn"
                                                                                            title="LinkedIn" width="32"
                                                                                            style="outline:
                                                                                            none;text-decoration:
                                                                                            none;-ms-interpolation-mode:
                                                                                            bicubic;clear: both;display:
                                                                                            block !important;border:
                                                                                            none;height: auto;float:
                                                                                            none;max-width: 32px
                                                                                            !important"> </a>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <!--[if (mso)|(IE)]></td><![endif]-->
                                                                    <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                                    <table align="left" border="0" cellspacing="0"
                                                                        cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout:
                                                                        fixed;border-spacing: 0;mso-table-lspace:
                                                                        0pt;mso-table-rspace: 0pt;vertical-align:
                                                                        top;Margin-right: 17px">
                                                                        <tbody>
                                                                            <tr style="vertical-align: top">
                                                                                <td align="left" valign="middle" style="word-break:
                                                                                    break-word;border-collapse: collapse
                                                                                    !important;vertical-align: top">
                                                                                    <a href="https://instagram.com/"
                                                                                        title="Instagram"
                                                                                        target="_blank"> <img
                                                                                            src="https://cdn.tools.unlayer.com/social/icons/circle-black/instagram.png"
                                                                                            alt="Instagram"
                                                                                            title="Instagram" width="32"
                                                                                            style="outline:
                                                                                            none;text-decoration:
                                                                                            none;-ms-interpolation-mode:
                                                                                            bicubic;clear: both;display:
                                                                                            block !important;border:
                                                                                            none;height: auto;float:
                                                                                            none;max-width: 32px
                                                                                            !important"> </a>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <!--[if (mso)|(IE)]></td><![endif]-->
                                                                    <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                                    <table align="left" border="0" cellspacing="0"
                                                                        cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout:
                                                                        fixed;border-spacing: 0;mso-table-lspace:
                                                                        0pt;mso-table-rspace: 0pt;vertical-align:
                                                                        top;Margin-right: 17px">
                                                                        <tbody>
                                                                            <tr style="vertical-align: top">
                                                                                <td align="left" valign="middle" style="word-break:
                                                                                    break-word;border-collapse: collapse
                                                                                    !important;vertical-align: top">
                                                                                    <a href="https://youtube.com/"
                                                                                        title="YouTube" target="_blank">
                                                                                        <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/youtube.png"
                                                                                            alt="YouTube"
                                                                                            title="YouTube" width="32"
                                                                                            style="outline:
                                                                                            none;text-decoration:
                                                                                            none;-ms-interpolation-mode:
                                                                                            bicubic;clear: both;display:
                                                                                            block !important;border:
                                                                                            none;height: auto;float:
                                                                                            none;max-width: 32px
                                                                                            !important"> </a>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <!--[if (mso)|(IE)]></td><![endif]-->
                                                                    <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 0px;" valign="top"><![endif]-->
                                                                    <table align="left" border="0" cellspacing="0"
                                                                        cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout:
                                                                        fixed;border-spacing: 0;mso-table-lspace:
                                                                        0pt;mso-table-rspace: 0pt;vertical-align:
                                                                        top;Margin-right: 0px">
                                                                        <tbody>
                                                                            <tr style="vertical-align: top">
                                                                                <td align="left" valign="middle" style="word-break:
                                                                                    break-word;border-collapse: collapse
                                                                                    !important;vertical-align: top">
                                                                                    <a href="https://email.com/"
                                                                                        title="Email" target="_blank">
                                                                                        <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/email.png"
                                                                                            alt="Email" title="Email"
                                                                                            width="32" style="outline:
                                                                                            none;text-decoration:
                                                                                            none;-ms-interpolation-mode:
                                                                                            bicubic;clear: both;display:
                                                                                            block !important;border:
                                                                                            none;height: auto;float:
                                                                                            none;max-width: 32px
                                                                                            !important"> </a>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <!--[if (mso)|(IE)]></td><![endif]-->
                                                                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                    </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                            </div>
                        </div>
                    </div>
                    <div class="u-row-container" style="padding:
                        0px;background-color: transparent">
                        <div style="Margin: 0 auto;min-width: 320px;max-width:
                            600px;overflow-wrap: break-word;word-wrap: break-word;word-break:
                            break-word;background-color: #8c30f5;" class="u-row">
                            <div style="border-collapse:
                                collapse;display: table;width: 100%;background-color: #8c30f5;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #8c30f5;"><![endif]-->

                                <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display:
                                    table-cell;vertical-align: top;">
                                    <div style="width: 100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px
                                            solid transparent;border-right: 0px solid transparent;border-bottom: 0px
                                            solid transparent;">
                                            <!--<![endif]-->
                                            <table id="u_content_text_8" class="u_content_text"
                                                style="font-family:'Cabin',sans-serif;" role="presentation"
                                                cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;"
                                                            align="left">
                                                            <div class="v-text-align" style="color: #fafafa; line-height: 180%; text-align:
                                                                center; word-wrap: break-word;">
                                                                <p style="font-size: 14px; line-height: 180%;"><span
                                                                        style="font-size: 16px; line-height:
                                                                        28.8px;">Copyrights &copy; Company All Rights
                                                                        Reserved</span></p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                    </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                            </div>
                        </div>
                    </div>
                    <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                </td>
            </tr>
        </tbody>
    </table>
    <!--[if (mso)|(IE)]></div><![endif]-->
</body>

</html>`,
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

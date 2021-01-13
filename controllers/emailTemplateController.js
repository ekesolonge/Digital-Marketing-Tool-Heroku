const connection = require("../models/db"); // database module
const Joi = require("joi"); // validator
const sendMail = require("../middleware/mailer");
const fetch = require("node-fetch");

// get emailTemplates
const getEmailTemplates = (req, res, next) => {
  connection.query(`select * from email_templates`, (err, resp) => {
    if (err) throw err;
    res.send(resp);
  });
};

// get emailTemplates by id
const getEmailTemplateById = (req, res, next) => {
  connection.query(
    `select * from email_templates where id = ${req.params.id}`,
    (err, resp) => {
      if (err || resp.length < 1)
        return res.status(404).send("Template does not exist.");
      res.send(resp[0]);
    }
  );
};

// Create new emailTemplate
const createEmailTemplate = (req, res, next) => {
  let { tempName, json, html } = req.body;

  let jsonContent = JSON.stringify(json);

  let urlImage = "https://api.unlayer.com/v2/export/image";
  let urlPDF = "https://api.unlayer.com/v2/export/pdf";

  // Convert API key to base64 first
  const token = Buffer.from(
    "IQQY9yYHEO4BQZG7cDu00qownOld7LNkhDi7CkPGJrr4zpizjF5xwKUQp6Nj7CBi:"
  ).toString("base64");

  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${token}`,
    },
    body: JSON.stringify({
      displayMode: "email",
      design: json,
    }),
  };

  Promise.all([fetch(urlImage, options), fetch(urlPDF, options)])
    .then(async ([img, pdf]) => {
      const image = await img.json();
      const PDF = await pdf.json();
      return [image, PDF];
    })
    .then((responseText) => {
      // INSERT into database
      connection.query(
        `insert into email_templates (user_id,name,json,html,image,pdf) values('${req.user.data.userId}','${tempName}',?,?,?,?)`,
        [jsonContent, html, responseText[0].data.url, responseText[1].data.url],
        (err, resp) => {
          if (err) return res.status(400).send("Internal Server Error");
          res.send("Email Template created successfully.");
        }
      );
    })
    .catch((err) => {
      res.status(400).send("Internal Server Error");
    });
};

// Edit emailTemplates
const editEmailTemplate = (req, res, next) => {
  connection.query(
    `SELECT * FROM email_templates WHERE id=${req.params.id}`,
    (err, db_res) => {
      if (err) {
        res.send(err);
      } else if (db_res.length < 1) {
        res.status(404).send(`No record found at ID ${req.params.id}`);
      } else {
        let email_templates = db_res;
        let user_id = req.user.data.userId;
        let name = req.body.name;
        let json = req.body.json;
        let html = req.body.html;
        let id = req.params.id;
        if (user_id == undefined) {
          user_id = email_templates[0].user_id;
        }
        if (name == undefined) {
          name = email_templates[0].name;
        }
        if (json == undefined) {
          json = email_templates[0].json;
        }
        if (html == undefined) {
          html = email_templates[0].html;
        }
        let sql = `update email_templates set user_id = '${user_id}', name = '${name}', json = '${json}', html = '${html}' where id = ${id}`;
        connection.query(sql, (err, db_res) => {
          if (err) return res.status(400).send(err);
          res.send(`Email Template Updated Successfully at ID: ${id}!`);
        });
      }
    }
  );
};

// DELETE emailTemplate
const deleteEmailTemplate = (req, res, next) => {
  connection.query(
    `delete from email_templates where id = ${req.params.id}`,
    (err, resp) => {
      if (resp.affectedRows === 0)
        return res.status(404).send("Template does not exist.");
      if (err) return res.send(err);
      res.send("Email Template successfully deleted.");
    }
  );
};

// Test emailTemplate
const testEmailTemplate = (req, res, next) => {
  let { senderName, html, email } = req.body;

  sendMail(
    "MartReach <martreach2@gmail.com>",
    `MartReach Email Template Test Mail by ${senderName}`,
    `${email}`,
    `${html}`,
    (err3, info) => {
      if (err3) return res.status(500).send(err3);
      res.status(201).send("Email Template sent successfully");
    }
  );
};

// Export functions
module.exports.getEmailTemplates = getEmailTemplates;
module.exports.getEmailTemplateById = getEmailTemplateById;
module.exports.createEmailTemplate = createEmailTemplate;
module.exports.editEmailTemplate = editEmailTemplate;
module.exports.deleteEmailTemplate = deleteEmailTemplate;
module.exports.testEmailTemplate = testEmailTemplate;

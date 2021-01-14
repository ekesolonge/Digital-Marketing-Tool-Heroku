const connection = require("../models/db"); // database module
const Joi = require("joi"); // validator
const sendMail = require("../middleware/mailer");
const fetch = require("node-fetch");
const logTrail = require("../middleware/auditTrail");

// get emailTemplates
const getEmailTemplates = (req, res, next) => {
  connection.query(
    `select * from email_templates where user_id=${req.user.data.userId}`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");
      res.send(resp);
    }
  );
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

          // Audit Trail
          let trail = {
            actor: req.user.data.userId,
            action: `created new email template`,
            type: "success",
          };
          logTrail(trail);
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
    `select * from email_templates where user_id=${req.user.data.userId}`,
    (err, resp) => {
      let emailTemplate = resp.find((x) => x.id == req.params.id);
      if (emailTemplate == undefined)
        return res.status(401).send("Cannot edit template you didn't create");
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
          let sql = `update email_templates set name = '${tempName}', json = ?, html = ?, image = ?, pdf = ?, lastEdited = current_timestamp() where id = ${req.params.id}`;
          connection.query(
            sql,
            [
              jsonContent,
              html,
              responseText[0].data.url,
              responseText[1].data.url,
            ],
            (err, db_res) => {
              if (err) return res.status(400).send("Internal Server Error");
              res.send(`Email Template Updated Successfully`);

              // Audit Trail
              let trail = {
                actor: req.user.data.userId,
                action: `updated an email template`,
                type: "success",
              };
              logTrail(trail);
            }
          );
        })
        .catch((err) => {
          res.status(400).send("Internal Server Error");
        });
    }
  );
};

// DELETE emailTemplate
const deleteEmailTemplate = (req, res, next) => {
  connection.query(
    `select * from email_templates where user_id=${req.user.data.userId}`,
    (err, resp1) => {
      let emailTemplate = resp1.find((x) => x.id == req.params.id);
      if (emailTemplate == undefined)
        return res.status(401).send("Cannot delete template you didn't create");
      connection.query(
        `delete from email_templates where id = ${req.params.id}`,
        (err, resp) => {
          if (resp.affectedRows === 0)
            return res.status(404).send("Template does not exist.");
          if (err) return res.status(400).send("Internal Server Error");
          res.send("Email Template successfully deleted.");

          // Audit Trail
          let trail = {
            actor: req.user.data.userId,
            action: `deleted an email template`,
            type: "warning",
          };
          logTrail(trail);
        }
      );
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
      if (err3) return res.status(500).send("Internal Server Error");
      res.status(201).send("Email Template Test Mail Sent successfully");

      // Audit Trail
      let trail = {
        actor: req.user.data.userId,
        action: `sent a test mail with an email template`,
        type: "success",
      };
      logTrail(trail);
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

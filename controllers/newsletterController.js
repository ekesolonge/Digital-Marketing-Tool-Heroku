const connection = require("../models/db"); // database module
const Joi = require("joi"); // validator
const sendMail = require("../middleware/mailer");

// subscribe to newsletter
const subscribe = (req, res, next) => {
  const { error } = validateTemplate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  connection.query(
    `insert into newsletter values('','${req.body.email.toLowerCase()}')`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");
      res.send("You have subscribed to MartReach newsletter successfully");
    }
  );
};

// GET
const getNewsletters = (req, res, next) => {
  connection.query(`select * from newsletter`, (err, resp) => {
    if (err) return res.status(400).send("Internal Server Error");
    res.send(resp);
  });
};

// Get by id
const getNewsletterById = (req, res, next) => {
  connection.query(
    `select * from newsletter where id = ${req.params.id}`,
    (err, resp) => {
      if (err || resp.length < 1)
        return res.status(404).send("Record does not exist.");
      res.send(resp[0]);
    }
  );
};

// DELETE
const deleteNewsletter = (req, res, next) => {
  connection.query(
    `delete from newsletter where id = ${req.params.id}`,
    (err, resp) => {
      if (resp.affectedRows === 0)
        return res.status(404).send("Record does not exist.");
      if (err) return res.status(400).send("Internal Server Error");
      res.send("Email successfully deleted from newsletter list.");
    }
  );
};

// Send newsletters
const sendNewsletter = (req, res, next) => {
  connection.query(`select * from newsletter`, (err, resp) => {
    if (err) throw err;
    let recipients = resp.map((x) => x.email);

    sendMail(
      "MartReach <martreach2@gmail.com>",
      "MartReach Weekly Newsletters",
      `${recipients}`,
      `This is a MartReach newsletter.`,
      (err3, info) => {
        if (err3) return res.status(400).send("Internal Server Error");
        res.status(201).send("Newsletter sent successfully!");
      }
    );
  });
};

function validateTemplate(template) {
  const schema = Joi.object({
    email: Joi.string()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ["com", "net"] },
      })
      .required(),
  });

  return schema.validate(template);
}

// Export functions
module.exports.subscribe = subscribe;
module.exports.getNewsletters = getNewsletters;
module.exports.getNewsletterById = getNewsletterById;
module.exports.deleteNewsletter = deleteNewsletter;
module.exports.sendNewsletter = sendNewsletter;

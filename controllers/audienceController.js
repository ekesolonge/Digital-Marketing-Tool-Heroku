const connection = require("../models/db");
const fs = require("fs");
const csv = require("csv-parser");
const logTrail = require("../middleware/auditTrail");

// Get audience API
const getAudience = (req, res) => {
  connection.query(
    `select * from audience where user_id=${req.user.data.userId}`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");
      res.send(resp);
    }
  );
};

const getAudienceById = (req, res) => {
  connection.query(
    `select * from audience where id = ${req.params.id}`,
    (err, resp) => {
      if (err || resp.length < 1)
        return res.status(404).send("Record does not exist.");
      res.send(resp[0]);
    }
  );
};

// Delete an audience API
const deleteAudience = (req, res) => {
  connection.query(
    `select * from audience where user_id=${req.user.data.userId}`,
    (err, resp) => {
      let audience = resp.find((x) => x.id == req.params.id);
      if (audience == undefined)
        return res.status(401).send("Cannot delete audience you didn't create");
      connection.query(
        `delete from audience where id = ${req.params.id}`,
        (err, resp) => {
          if (err) return res.status(400).send("Internal Server Error");
          res.send("audience successfully deleted");
          // Audit Trail
          let trail = {
            actor: req.user.data.userId,
            action: `deleted audience`,
            type: "warning",
          };
          logTrail(trail);
        }
      );
    }
  );
};

// REST API to Insert audience
const createAudience = (req, res) => {
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.email ||
    !req.body.tel
  )
    return res.status(400).send("Please fill all required fields");

  if (!req.body.country) req.body.country = "";
  if (!req.body.state) req.body.state = "";
  if (!req.body.city) req.body.city = "";
  if (!req.body.birthday) req.body.birthday = "";

  // INSERT into database
  connection.query(
    `insert into audience (user_id,subscriberGroup,firstName,lastName,tel,email,country,state,city,birthday) values 
              ('${req.user.data.userId}',
              '${null}',
              '${req.body.firstName}',
              '${req.body.lastName}',
              '${req.body.tel}',
              '${req.body.email}',
              '${req.body.country}',
              '${req.body.state}',
              '${req.body.city}',
              '${req.body.birthday}')`,
    (error, resp) => {
      if (error) return res.status(400).send("Internal Server Error");
      res.send("audience successfully created.");
      res.end();

      // Audit Trail
      let trail = {
        actor: req.user.data.userId,
        action: `created new audience`,
        type: "success",
      };
      logTrail(trail);
    }
  );
};

//rest api to update record into mysql database
const editAudience = (req, res) => {
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.email ||
    !req.body.subscriberGroup ||
    !req.body.tel
  )
    return res.status(400).send("Please fill all required fields");

  if (!req.body.country) req.body.country = "";
  if (!req.body.state) req.body.state = "";
  if (!req.body.city) req.body.city = "";
  if (!req.body.birthday) req.body.birthday = "";

  connection.query(
    `select * from audience where user_id=${req.user.data.userId}`,
    (err, resp) => {
      let audience = resp.find((x) => x.id == req.params.id);
      if (audience == undefined)
        return res.status(401).send("Cannot edit audience you didn't create");
      connection.query(
        `update audience set subscriberGroup ='${req.body.subscriberGroup}' ,firstName = '${req.body.firstName}', lastName = '${req.body.lastName}', tel='${req.body.tel}', email='${req.body.email}',
         country='${req.body.country}', state='${req.body.state}', city='${req.body.city}', birthday='${req.body.birthday}' where id=${req.params.id}`,
        (err, response) => {
          if (err) return res.status(400).send("Internal Server Error");
          res.send("audience edited Successfully");

          // Audit Trail
          let trail = {
            actor: req.user.data.userId,
            action: `edited audience`,
            type: "success",
          };
          logTrail(trail);
        }
      );
    }
  );
};

// Upload CSV file
const importContacts = (req, res) => {
  if (req.file == undefined)
    return res.status(400).send("Please upload a CSV file!");

  const results = [];
  let path = "uploads/docs/" + req.file.filename;

  fs.createReadStream(path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      let values = "values";

      results.map((contact) => {
        if (contact.birthday == undefined) contact.birthday = null;
        if (contact.country == undefined) contact.country = contact.county;

        values += `(${req.user.data.userId}, '${null}', '${
          contact.first_name
        }', '${contact.last_name}', '${contact.phone}', '${contact.email}', '${
          contact.country
        }', '${contact.state}', '${contact.city}', '${contact.birthday}'),\n`;
      });

      let finalValue = values.slice(0, -2);

      connection.query(
        `insert into audience (user_id,subscriberGroup,firstName,lastName,tel,email,country,state,city,birthday) ${finalValue}`,
        (dbErr, resp) => {
          if (dbErr) return res.status(400).send("Internal Server Error");
          res.send("Contacts Imported Successfully");

          // Audit Trail
          let trail = {
            actor: req.user.data.userId,
            action: `imported contacts`,
            type: "success",
          };
          logTrail(trail);
        }
      );
    });
};

module.exports = {
  getAudience,
  getAudienceById,
  deleteAudience,
  createAudience,
  editAudience,
  importContacts,
};

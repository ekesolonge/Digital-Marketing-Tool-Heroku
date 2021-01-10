const connection = require("../models/db");
const sendMail = require("../middleware/mailer");

// Get campaign API
const getCampaign = (req, res) => {
  connection.query(`select * from campaign`, (err, resp) => {
    if (err || resp.length < 1)
      return res.status(404).send("Record does not exist.");
    res.send(resp);
  });
};

const getCampaignById = (req, res) => {
  connection.query(
    `select * from campaign where id = ${req.params.id}`,
    (err, resp) => {
      if (err || resp.length < 1)
        return res.status(404).send("Record does not exist.");
      res.send(resp[0]);
    }
  );
};

// Delete an campaign API
const deleteCampaign = (req, res) => {
  connection.query(
    `select * from campaign where createdBy=${req.user.data.userId}`,
    (err, resp) => {
      let campaign = resp.find((x) => x.id == req.params.id);
      if (campaign == undefined)
        return res.status(401).send("Cannot delete campaign you didn't create");
      connection.query(
        `delete from campaign where id = ${req.params.id}`,
        (err, resp) => {
          if (err) return res.send(err);
          res.send("campaign successfully deleted at ID " + req.params.id);
        }
      );
    }
  );
};

// REST API to Insert campaign
const createCampaign = (req, res) => {
  if (!req.body.name || !req.body.subscriberGroup || !req.body.emailTemplate)
    return res.status(400).send("Please fill all required fields");

  // INSERT into database
  connection.query(
    `insert into campaign (name,subscriberGroup,emailTemplate,createdBy) values 
                  ('${req.body.name}',
                  '${req.body.subscriberGroup}',
                  '${req.body.emailTemplate}',
                  '${req.user.data.userId}')`,
    (error, resp) => {
      if (error) return res.send("Internal Server Error");
      res.send("campaign successfully created.");
      res.end();
    }
  );
};

//rest api to update record into mysql database
const editCampaign = (req, res) => {
  connection.query(
    `select * from campaign where createdBy=${req.user.data.userId}`,
    (err, resp) => {
      let campaign = resp.find((x) => x.id == req.params.id);
      if (campaign == undefined)
        return res.status(401).send("Cannot edit campaign you didn't create");
      connection.query(
        `update campaign set name = '${req.body.name}',name = '${req.body.subscriberGroup}',name = '${req.body.emailTemplate}' where id=${req.params.id}`,
        (err, response) => {
          if (err) return res.status(400).send("Internal server error");
          res.send("campaign edited Successfully");
        }
      );
    }
  );
};

// Send Campaign
const sendCampaign = (req, res, next) => {
  connection.query(
    `select campaign.name as campaignName,audience.email,subscriber_group.name,email_templates.html from campaign 
    inner join subscriber_group on campaign.subscriberGroup = subscriber_group.id 
    inner join audience on audience.subscriberGroup = subscriber_group.id 
    inner join email_templates on email_templates.id = campaign.emailTemplate where campaign.id=${req.params.id}`,
    (err, resp) => {
      if (resp.length < 1 || err)
        return res.status(400).send("Internal server error");

      if (!req.body.subject) req.body.subject = resp[0].campaignName;
      if (!req.body.from) req.body.from = req.user.data.email;

      let recipients = resp.map((x) => x.email);

      sendMail(
        `"${req.body.from}" <${req.user.data.email}>`,
        `${req.body.subject}`,
        `${recipients}`,
        `${resp[0].html}`,
        (err3, info) => {
          if (err3) return res.status(500).send(err3);
          res.status(201).send("Campaign sent successfully!");
        }
      );
    }
  );
};

module.exports = {
  getCampaign,
  getCampaignById,
  deleteCampaign,
  createCampaign,
  editCampaign,
  sendCampaign,
};

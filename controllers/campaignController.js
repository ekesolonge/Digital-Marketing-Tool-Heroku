const connection = require("../models/db");
const sendMail = require("../middleware/mailer");
const logTrail = require("../middleware/auditTrail");

// Get campaign API
const getCampaign = (req, res) => {
  connection.query(
    `select * from campaign where createdBy=${req.user.data.userId}`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");
      if (resp.length < 1)
        return res.status(404).send("Record does not exist.");
      res.send(resp);
    }
  );
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
          if (err) return res.status(400).send("Internal Server Error");
          res.send("campaign successfully deleted");

          // Audit Trail
          let trail = {
            actor: req.user.data.username,
            action: `deleted campaign`,
            type: "warning",
          };
          logTrail(trail);
        }
      );
    }
  );
};

// REST API to Insert campaign
const createCampaign = (req, res) => {
  if (
    !req.body.name ||
    !req.body.fromName ||
    !req.body.fromEmail ||
    !req.body.subject ||
    !req.body.subscriberGroup ||
    !req.body.emailTemplate
  )
    return res.status(400).send("Please fill all required fields");

  connection.query(
    `select subscriber_group.id as subscriberGroupID,email_templates.id as emailTemplateID, userId FROM subscriber_group INNER join email_templates on userId = user_id where userId = ${req.user.data.userId}`,
    (error, resp) => {
      if (resp.length < 1)
        return res
          .status(404)
          .send("User has no email templates or subscriber groups yet");

      let emailTemplate = resp.find(
        (x) => x.subscriberGroupID == req.body.subscriberGroup
      );
      let subscriberGroup = resp.find(
        (x) => x.emailTemplateID == req.body.emailTemplate
      );

      if (emailTemplate == undefined || subscriberGroup == undefined)
        return res
          .status(404)
          .send("Email Template or Subscriber doesn't exist");

      // INSERT into database
      connection.query(
        `insert into campaign (name,fromName,fromEmail,subject,subscriberGroup,emailTemplate,createdBy) values
                  ('${req.body.name}',
                  '${req.body.fromName}',
                  '${req.body.fromEmail}',
                  '${req.body.subject}',
                  '${req.body.subscriberGroup}',
                  '${req.body.emailTemplate}',
                  '${req.user.data.userId}')`,
        (error, resp) => {
          if (error) return res.status(400).send("Internal Server Error");
          res.send("campaign successfully created.");
          res.end();

          // Audit Trail
          let trail = {
            actor: req.user.data.username,
            action: `created new campaign`,
            type: "success",
          };
          logTrail(trail);
        }
      );
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
        `select subscriber_group.id as subscriberGroupID,email_templates.id as emailTemplateID, userId FROM subscriber_group INNER join email_templates on userId = user_id where userId = ${req.user.data.userId}`,
        (error, resp) => {
          if (resp.length < 1)
            return res
              .status(404)
              .send("User has no email templates or subscriber groups yet");

          connection.query(
            `update campaign set name = '${req.body.name}',fromName = '${req.body.fromName}',fromEmail = '${req.body.fromEmail}',subject = '${req.body.subject}',subscriberGroup = '${req.body.subscriberGroup}',emailTemplate = '${req.body.emailTemplate}',dateCreated = current_timestamp() where id=${req.params.id}`,
            (err, response) => {
              if (err) return res.status(400).send("Internal server error");
              res.send("campaign edited Successfully");

              // Audit Trail
              let trail = {
                actor: req.user.data.username,
                action: `edited campaign`,
                type: "success",
              };
              logTrail(trail);
            }
          );
        }
      );
    }
  );
};

// Send Campaign
const sendCampaign = (req, res, next) => {
  connection.query(
    `select campaign.name as campaignName,campaign.fromName,campaign.fromEmail,campaign.subject,audience.email,subscriber_group.name,email_templates.html from campaign 
    inner join subscriber_group on campaign.subscriberGroup = subscriber_group.id 
    inner join audience_group on audience_group.subscriberGroupId = subscriber_group.id 
    inner join audience on audience_group.audienceId = audience.id 
    inner join email_templates on email_templates.id = campaign.emailTemplate where campaign.createdBy=${req.user.data.userId} and campaign.id=${req.params.id}`,
    (err, resp) => {
      if (!resp || resp.length < 1 || err)
        return res.status(400).send("Internal server error");

      let recipients = resp.map((x) => x.email);

      let from = {
        name: resp[0].fromName,
        address: resp[0].fromEmail,
      };

      sendMail(
        from,
        resp[0].subject,
        recipients,
        resp[0].html,
        (err3, info) => {
          if (err3) return res.status(400).send("Internal Server Error");
          res.status(201).send("Campaign sent successfully!");

          // Audit Trail
          let trail = {
            actor: req.user.data.username,
            action: `sent a campaign`,
            type: "success",
          };
          logTrail(trail);
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

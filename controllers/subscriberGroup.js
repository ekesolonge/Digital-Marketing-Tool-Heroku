const connection = require("../models/db");
const logTrail = require("../middleware/auditTrail");

// Get subscriber_group API
const getSubscriberGroup = (req, res) => {
  connection.query(
    `select * from subscriber_group where userId=${req.user.data.userId}`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");
      res.send(resp);
    }
  );
};

const getSubscriberGroupById = (req, res) => {
  connection.query(
    `select * from subscriber_group where id = ${req.params.id}`,
    (err, resp) => {
      if (err || resp.length < 1)
        return res.status(404).send("Record does not exist.");
      res.send(resp[0]);
    }
  );
};

// Delete an subscriber_group API
const deleteSubscriberGroup = (req, res) => {
  connection.query(
    `select * from subscriber_group where userId=${req.user.data.userId}`,
    (err, resp) => {
      let subscriberGroup = resp.find((x) => x.id == req.params.id);
      if (subscriberGroup == undefined)
        return res
          .status(401)
          .send("Cannot delete subscriber group you didn't create");
      connection.query(
        `delete from subscriber_group where id = ${req.params.id}`,
        (err, resp) => {
          if (err) return res.status(400).send("Internal Server Error");
          res.send("subscriber group successfully deleted");

          // Audit Trail
          let trail = {
            actor: req.user.data.username,
            action: `deleted a subscriber group`,
            type: "warning",
          };
          logTrail(trail);
        }
      );
    }
  );
};

// REST API to Insert subscriber_group
const createSubscriberGroup = (req, res) => {
  if (!req.body.name)
    return res.status(400).send("Please fill all required fields");

  // INSERT into database
  connection.query(
    `insert into subscriber_group (name,userId) values 
                ('${req.body.name}',
                '${req.user.data.userId}')`,
    (error, resp) => {
      if (error) return res.status(400).send("Internal Server Error");
      res.send("subscriber group successfully created.");
      res.end();

      // Audit Trail
      let trail = {
        actor: req.user.data.username,
        action: `created a subscriber group`,
        type: "success",
      };
      logTrail(trail);
    }
  );
};

//rest api to update record into mysql database
const editSubscriberGroup = (req, res) => {
  connection.query(
    `select * from subscriber_group where userId=${req.user.data.userId}`,
    (err, resp) => {
      let subscriberGroup = resp.find((x) => x.id == req.params.id);
      if (subscriberGroup == undefined)
        return res
          .status(401)
          .send("Cannot edit subscriber group you didn't create");
      connection.query(
        `update subscriber_group set name = '${req.body.name}' where id=${req.params.id}`,
        (err, response) => {
          if (err) return res.status(400).send("Internal Server Error");
          res.send("subscriber group edited Successfully");

          // Audit Trail
          let trail = {
            actor: req.user.data.username,
            action: `edited a subscriber group`,
            type: "success",
          };
          logTrail(trail);
        }
      );
    }
  );
};

// Assign audience to a group
const assignSubscriberGroup = (req, res) => {
  connection.query(
    `select subscriber_group.id as subscriberGroupID, audience.id as audienceId, userId from subscriber_group inner join audience on userId = user_id where userId=${req.user.data.userId}`,
    (err, resp) => {
      let audience = resp.find((x) => x.audienceId == req.params.audienceId);

      let subscriberGroup = resp.find(
        (x) => x.subscriberGroupID == req.params.groupId
      );
      if (subscriberGroup == undefined || audience == undefined)
        return res
          .status(401)
          .send("Cannot edit subscriber group you didn't create");

      connection.query(
        `select * from audience_group where userId = ${req.user.data.userId}`,
        (err, resp2) => {
          // Check if audience is already in selected group
          let aud = resp2.find((x) => x.audienceId == req.params.audienceId);
          let group = resp2.find(
            (x) => x.subscriberGroupId == req.params.groupId
          );
          if (aud && group)
            return res
              .status(401)
              .send("audience is already in selected group");

          connection.query(
            `insert into audience_group (userId,audienceId,subscriberGroupId) values ('${req.user.data.userId}','${req.params.audienceId}','${req.params.groupId}')`,
            (err, response) => {
              if (err) return res.status(400).send("Internal Server Error");
              res.send("Audience successfully added to subscriber group");

              // Audit Trail
              let trail = {
                actor: req.user.data.username,
                action: `assign audience with id ${req.params.audienceId} a subscriber group with id ${req.params.groupId}`,
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

module.exports = {
  getSubscriberGroup,
  getSubscriberGroupById,
  deleteSubscriberGroup,
  createSubscriberGroup,
  editSubscriberGroup,
  assignSubscriberGroup,
};

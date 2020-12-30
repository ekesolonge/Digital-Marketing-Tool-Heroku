const connection = require("../models/db");

// Get subscriber_group API
const getSubscriberGroup = (req, res) => {
  connection.query(`select * from subscriber_group`, (err, resp) => {
    if (err) throw err;
    res.send(resp);
  });
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
    `delete from subscriber_group where id = ${req.params.id}`,
    (err, resp) => {
      if (err) return res.send(err);
      res.send("subscriber_group successfully deleted at ID " + req.params.id);
    }
  );
};

// REST API to Insert subscriber_group
const createSubscriberGroup = (req, res) => {
  if (!req.body.name)
    return res.status(400).send("Please fill all required fields");

  // INSERT into database
  connection.query(
    `insert into subscriber_group (name,user_id) values 
                ('${req.body.name}',
                '${req.user.data.userId}')`,
    (error, resp) => {
      if (error) return res.send(error.sqlMessage);
      res.send("subscriber_group successfully created.");
      res.end();
    }
  );
};

//rest api to update record into mysql database
const editSubscriberGroup = (req, res) => {
  connection.query(
    `update subscriber_group set user_id = '${req.user.data.userId}', name = '${req.body.name}' where id=${req.params.id}`,
    (err, response) => {
      if (err) throw err;
      res.send("subscriber_group edited Successfully");
    }
  );
};

module.exports = {
  getSubscriberGroup,
  getSubscriberGroupById,
  deleteSubscriberGroup,
  createSubscriberGroup,
  editSubscriberGroup,
};

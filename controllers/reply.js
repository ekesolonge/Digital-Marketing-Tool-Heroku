const connection = require("../models/db"); // database module

// Get Reply
const getReply = (req, res) => {
  connection.query(`select * from reply_user`, (err, resp) => {
    if (err) throw err;
    res.send(resp);
  });
};

// Post Reply
const createReply = (req, res) => {
  if (!req.params.id || !req.body.suggestionId || !req.body.message)
    return res.status(400).send("Please fill all required fields");

  // INSERT into database
  connection.query(
    `insert into reply_user (userId,suggestionId,message) values('${req.user.data.userId}','${req.params.id}','${req.body.message}')`,
    (err, resp) => {
      if (err) return res.status(400).send(err);
      res.send(resp[0].message);
    }
  );
};

module.exports = { getReply, createReply };

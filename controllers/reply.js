const reply = (app) => {
  const connection = require("../models/db"); // database module
  const { authenticate } = require("../middleware/authorization"); // authorization middleware

  // Get Reply
  app.get("/reply", authenticate, (req, res) => {
    connection.query(`select * from reply_user`, (err, resp) => {
      if (err) throw err;
      res.send(resp);
    });
  });

  // Post Reply
  app.post("/reply/:id", authenticate, (req, res) => {
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
  });
};

module.exports = reply;

const connection = require("../models/db"); // database module
const logTrail = require("../middleware/auditTrail");

// Get Suggestion
const getSuggestions = (req, res) => {
  connection.query(`select * from suggestions`, (err, resp) => {
    if (err) return res.status(400).send("Internal Server Error");
    res.send(resp);
  });

  connection.query(`update suggestions set isRead = ${true}`, (err, resp) => {
    if (err) return res.status(400).send("Internal Server Error");
    return;
  });
};

//Post Suggestions
const createSuggestions = (req, res) => {
  if (!req.body.category || !req.body.message)
    return res.status(400).send("Please fill all required fields");

  // INSERT into database
  connection.query(
    `insert into suggestions (userId,category,message,isRead) values('${
      req.user.data.userId
    }','${req.body.category}','${req.body.message}',${false})`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");
      res.send("Suggestion Sent successfully.");

      // Audit Trail
      let trail = {
        actor: req.user.data.username,
        action: `sent suggestion to admin`,
        type: "success",
      };
      logTrail(trail);
    }
  );
};

module.exports = { getSuggestions, createSuggestions };

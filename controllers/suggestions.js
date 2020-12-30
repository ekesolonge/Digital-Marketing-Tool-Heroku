const connection = require("../models/db"); // database module

// Get Suggestion
const getSuggestions = (req, res) => {
  connection.query(`select * from suggestions`, (err, resp) => {
    if (err) throw err;
    res.send(resp);
  });
};

//Post Suggestions
const createSuggestions = (req, res) => {
  if (!req.body.category || !req.body.message)
    return res.status(400).send("Please fill all required fields");

  // INSERT into database
  connection.query(
    `insert into suggestions (userId,category,message) values('${req.user.data.userId}','${req.body.category}','${req.body.message}')`,
    (err, resp) => {
      if (err) return res.status(400).send(err);
      res.send("Suggestion received successfully.");
    }
  );
};

module.exports = { getSuggestions, createSuggestions };

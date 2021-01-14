const connection = require("../models/db");

const logTrail = (trail) => {
  connection.query(
    `insert into trail (actor,action,type) values('${trail.actor}','${trail.action}','${trail.type}')`,
    (err, res) => {
      if (err) return res.status(400).send("Internal Server Error");
    }
  );
};

module.exports = logTrail;

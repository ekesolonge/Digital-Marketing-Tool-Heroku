const connection = require("../models/db");

const logTrail = (trail) => {
  connection.query(
    `insert into trail (actor,action,type) values('${trail.actor}','${trail.action}','${trail.type}')`,
    (err, res) => {
      if (err) throw err;
    }
  );
};

module.exports = logTrail;

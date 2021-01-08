const connection = require("../models/db"); // database module

// Get sticky notes
const getStickyNote = (req, res) => {
  connection.query(`select * from sticky_note`, (err, resp) => {
    if (err || resp.length < 1)
      return res.status(404).send("No sticky notes available");
    res.send(resp[0]);
  });
};

// Get sticky note details by id
const getStickyNoteById = (req, res) => {
  connection.query(
    `select * from sticky_note where id = ${req.params.id}`,
    (err, resp) => {
      if (err || resp.length < 1)
        return res.status(404).send("Sticky note does not exist.");
      res.send(resp[0]);
    }
  );
};

// Create Sticky note
const saveStickyNote = (req, res) => {
  connection.query(
    // Check if sticky note exists
    `select * from sticky_note where userId=${req.user.data.userId}`,
    (err, response) => {
      if (err) return res.status(400).send("Internal Server Error");

      if (!req.body.note) req.body.note = "";

      // if sticky note doesn't exist
      if (response.length < 1) {
        // Create new sticky note
        connection.query(
          `insert into sticky_note (userId,note)
        values('${req.user.data.userId}','${req.body.note}')`,
          (err, resp) => {
            if (err) return res.status(400).send("Internal Server Error");
            res.send("Sticky Note Created Successfully.");
          }
        );
      } // if sticky note doesn't exists
      else {
        // Update sticky note
        connection.query(
          `update sticky_note set note = '${req.body.note}' where userId=${req.user.data.userId}`,
          (err, response) => {
            if (err) return res.status(400).send("Internal Server Error");
            res.send("Sticky Note Updated Successfully");
          }
        );
      }
    }
  );
};

module.exports = { getStickyNote, saveStickyNote, getStickyNoteById };

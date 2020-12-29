var campaign = (app) => {
    const connection = require("../models/db");
    const { authenticate } = require("../middleware/authorization"); // authorization middleware
  
    // Get subscriber_group API
    app.get("/campaign", authenticate, (req, res) => {
      connection.query(`select * from campaign`, (err, resp) => {
        if (err) throw err;
        res.send(resp);
      });
    });
  
    app.get("/campaign/:id", authenticate, (req, res) => {
      connection.query(
        `select * from campaign where id = ${req.params.id}`,
        (err, resp) => {
          if (err || resp.length < 1)
            return res.status(404).send("Record does not exist.");
          res.send(resp[0]);
        }
      );
    });
  
    // Delete an subscriber_group API
    app.delete("/campaign/:id", authenticate, (req, res) => {
      connection.query(
        `delete from campaign where id = ${req.params.id}`,
        (err, resp) => {
          if (err) return res.send(err);
          res.send(
            "campaign successfully deleted at ID " + req.params.id
          );
        }
      );
    });
  
    // REST API to Insert subscriber_group
    app.post("/campaign", authenticate, (req, res) => {
      if (!req.body.name)
        return res.status(400).send("Please fill all required fields");
  
      // INSERT into database
      connection.query(
        `insert into campaign (name,user_id) values 
                  ('${req.body.name}',
                  '${req.user.data.userId}')`,
        (error, resp) => {
          if (error) return res.send(error.sqlMessage);
          res.send("campaign successfully created.");
          res.end();
        }
      );
    });
  
    //rest api to update record into mysql database
    app.put("/campaign/:id", authenticate, (req, res) => {
      connection.query(
        `update campaign set user_id = '${req.user.data.userId}', name = '${req.body.name}' where id=${req.params.id}`,
        (err, response) => {
          if (err) throw err;
          res.send("campaign edited Successfully");
        }
      );
    });
  };
  
  module.exports = campaign;

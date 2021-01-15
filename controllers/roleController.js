const connection = require("../models/db");
const logTrail = require("../middleware/auditTrail");

// VIEW ROLES
const getRoles = (req, res, next) => {
  connection.query(`select * from role`, (err, resp) => {
    if (err) return res.status(400).send("Internal Server Error");
    res.send(resp);
  });
};

// VIEW ROLES BY ID
const getRoleById = (req, res, next) => {
  connection.query(
    `select * from role where id = ${req.params.id}`,
    (err, resp) => {
      if (err || resp.length < 1)
        return res.status(404).send("Record does not exist.");
      res.send(resp[0]);
    }
  );
};

// DELETE ROLES
const deleteRole = (req, res, next) => {
  connection.query(
    `delete from role where id = ${req.params.id}`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");
      res.send("role successfully deleted");

      // Audit Trail
      let trail = {
        actor: req.user.data.username,
        action: `deleted a role`,
        type: "warning",
      };
      logTrail(trail);
    }
  );
};

// CREATE ROLES
const createRole = (req, res, next) => {
  if (!req.body.roleName || !req.body.roleDescription)
    return res.status(400).send("Please fill all required fields");

  connection.query(
    `insert into role (roleName,roleDescription) values 
              ('${req.body.roleName}',
              '${req.body.roleDescription}')`,
    (error, resp) => {
      if (error) return res.status(400).send("Internal Server Error");
      res.send("role successfully created.");
      res.end();

      // Audit Trail
      let trail = {
        actor: req.user.data.username,
        action: `created a new role`,
        type: "success",
      };
      logTrail(trail);
    }
  );
};

// EDIT ROLES
const editRole = (req, res, next) => {
  let { roleName, roleDescription } = req.body;
  connection.query(
    `SELECT * FROM role WHERE id=${req.params.id}`,
    (err, db_res) => {
      if (err) {
        return res.status(400).send("Internal Server Error");
      } else if (db_res.length < 1) {
        res.status(404).send(`Error! role does not exist.`);
      } else {
        let roles = db_res;
        if (roleName == undefined) roleName = roles[0].roleName;

        if (roleDescription == undefined)
          roleDescription = roles[0].roleDescription;
        connection.query(
          `update role set roleName = '${roleName}', roleDescription = '${roleDescription}' where id=${req.params.id}`,
          (err, response) => {
            if (err) return res.status(400).send("Internal Server Error");
            res.send("role edited Successfully");

            // Audit Trail
            let trail = {
              actor: req.user.data.username,
              action: `edited a role`,
              type: "success",
            };
            logTrail(trail);
          }
        );
      }
    }
  );
};

// ASSIGN ROLE TO USER
const assignRole = (req, res, next) => {
  let { roleId, userId } = req.params;
  if (!roleId || !userId)
    return res.status(400).send("Please input valid parameters");

  // Check if user already has a role and delete current role
  connection.query(
    `select * from user_role where userId=${userId}`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");
      if (resp.length > 0) {
        connection.query(
          `delete from user_role where userId = ${userId}`,
          (error, resp1) => {
            if (error) return res.status(400).send("Internal Server Error");
          }
        );
      }
      // Assign new role to the user
      connection.query(
        `insert into user_role values 
              ('','${roleId}',
              '${userId}')`,
        (error, resp1) => {
          if (error) return res.status(400).send("Internal Server Error");
          res.send(`User ID ${userId} has been assigned role ID ${roleId}`);

          // Audit Trail
          let trail = {
            actor: req.user.data.username,
            action: `assigned a role with id ${roleId} to a user with id ${userId}`,
            type: "success",
          };
          logTrail(trail);
        }
      );
    }
  );
};

// Export functions
module.exports.getRoles = getRoles;
module.exports.getRoleById = getRoleById;
module.exports.deleteRole = deleteRole;
module.exports.createRole = createRole;
module.exports.editRole = editRole;
module.exports.assignRole = assignRole;

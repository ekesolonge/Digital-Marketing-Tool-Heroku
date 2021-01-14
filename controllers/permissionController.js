const connection = require("../models/db");
const logTrail = require("../middleware/auditTrail");

// Get permission API
const getPermissions = (req, res, next) => {
  connection.query(`select * from permission`, (err, resp) => {
    if (err) return res.status(400).send("Internal Server Error");
    res.send(resp);
  });
};

const getPermissionById = (req, res, next) => {
  connection.query(
    `select * from permission where id = ${req.params.id}`,
    (err, resp) => {
      if (err || resp.length < 1)
        return res.status(404).send("Record does not exist.");
      res.send(resp[0]);
    }
  );
};

// Delete an permission API
const deletePermission = (req, res, next) => {
  connection.query(
    `delete from permission where id = ${req.params.id}`,
    (err, resp) => {
      if (err) return res.status(400).send("Internal Server Error");
      res.send("permission successfully deleted");

      // Audit Trail
      let trail = {
        actor: req.user.data.userId,
        action: `deleted a permission`,
        type: "warning",
      };
      logTrail(trail);
    }
  );
};

// REST API to Insert permission
const createPermission = (req, res, next) => {
  if (
    !req.body.permissionName ||
    !req.body.permissionDescription ||
    !req.body.groupName
  )
    return res.status(400).send("Please fill all required fields");

  connection.query(
    `insert into permission (permissionName,permissionDescription,groupName) values 
              ('${req.body.permissionName}',
              '${req.body.permissionDescription}',
              '${req.body.groupName}')`,
    (error, resp) => {
      if (error) return res.status(400).send("Internal Server Error");
      res.send("permission successfully created.");
      res.end();

      // Audit Trail
      let trail = {
        actor: req.user.data.userId,
        action: `created a new permission`,
        type: "success",
      };
      logTrail(trail);
    }
  );
};

//rest api to update permission into mysql database
const editPermission = (req, res, next) => {
  connection.query(
    `update permission set permissionName = '${req.body.permissionName}', permissionDescription = '${req.body.permissionDescription}',groupName = '${req.body.groupName}' where id=${req.params.id}`,
    (err, response) => {
      if (err) return res.status(400).send("Internal Server Error");
      res.send("permission edited Successfully");

      // Audit Trail
      let trail = {
        actor: req.user.data.userId,
        action: `edited a permission`,
        type: "success",
      };
      logTrail(trail);
    }
  );
};

// ASSIGN PERMISSION TO ROLE
const assignPermission = (req, res, next) => {
  let { roleId, permissionId } = req.params;
  if (!roleId || !permissionId)
    return res.status(400).send("Please input valid parameters");

  connection.query(
    `insert into role_permission values 
              ('','${roleId}',
              '${permissionId}')`,
    (error, resp1) => {
      if (error) return res.status(400).send("Internal Server Error");
      res.send(
        `Permission ID ${permissionId} has been assigned to role ID ${roleId}`
      );

      // Audit Trail
      let trail = {
        actor: req.user.data.userId,
        action: `assigned a permission with id ${permissionId} to a role with id ${roleId}`,
        type: "success",
      };
      logTrail(trail);
    }
  );
};

// Export functions
module.exports.getPermissions = getPermissions;
module.exports.getPermissionById = getPermissionById;
module.exports.deletePermission = deletePermission;
module.exports.createPermission = createPermission;
module.exports.editPermission = editPermission;
module.exports.assignPermission = assignPermission;

const connection = require("../models/db");

// Get permission API
const getPermissions = (req, res, next) => {
  connection.query(`select * from permission`, (err, resp) => {
    if (err) throw err;
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
      if (err) return res.send(err);
      res.send("permission successfully deleted at ID " + req.params.id);
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
};

//rest api to update permission into mysql database
const editPermission = (req, res, next) => {
  connection.query(
    `update permission set permissionName = '${req.body.permissionName}', permissionDescription = '${req.body.permissionDescription}',groupName = '${req.body.groupName}' where id=${req.params.id}`,
    (err, response) => {
      if (err) throw err;
      res.send("permission edited Successfully");
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
      if (error) return res.send(error.sqlMessage);
      res.send(
        `Permission ID ${permissionId} has been assigned to role ID ${roleId}`
      );
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

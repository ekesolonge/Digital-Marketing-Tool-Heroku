const connection = require("../models/db"); // database module

// Create Billing Info
const createBillingInfo = (req, res) => {
  if (
    !req.body.transactionId ||
    !req.body.billingContactName ||
    !req.body.billingCompanyName ||
    !req.body.billingAddress ||
    !req.body.billingPhoneNumber ||
    !req.body.billingEmailAddress
  )
    return res.status(400).send("Please fill all required fields");

  // INSERT into database
  connection.query(
    `insert into billing_info (userId,transactionId,billingContactName,billingContactName,billingAddress,billingPhoneNumber,billingEmailAddress) 
        values('${req.user.data.userId}','${req.body.transactionId}','${req.body.billingContactName}',${req.body.billingCompanyName}','${req.body.billingAddress}','${req.body.billingPhoneNumber}','${req.body.billingEmailAddress}')`,
    (err, res) => {
      if (err) return res.status(400).send(err);
      res.send("Billing Info Saved Successfully.");
    }
  );
};

//Edit Billing Info
const editBillingInfo = (req, res) => {
  connection.query(
    `update billing_info set userId = '${req.user.data.userId}', billingContactName = '${req.body.billingContactName}', billingCompanyName = '${req.body.billingCompanyName}', billingAddress='${req.body.billingAddress}', billingPhoneNumber='${req.body.billingPhoneNumber}', billingEmailAddress='${req.body.billingEmailAddress}' where id=${req.params.id}`,
    (err, response) => {
      if (err) throw err;
      response.send("Billing Info Updated Successfully");
    }
  );
};

module.exports = { createBillingInfo, editBillingInfo };

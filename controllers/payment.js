const connection = require("../models/db"); // database module
const { v4: uuidv4 } = require("uuid"); //uuid module for generating universally unique identifiers used for transaction id
const fetch = require("node-fetch");
const url = require("url");
const moment = require("moment");
const logTrail = require("../middleware/auditTrail");

// Get all payments
const getPayment = (req, res) => {
  connection.query(`select * from payment`, (err, resp) => {
    if (err || resp.length < 1)
      return res.status(404).send("Payment Details does not exist.");
    res.send(resp);
  });
};

// Payment Plan Creation
const createPlan = (req, res) => {
  const { amount, name, interval, duration, description } = req.body;

  fetch(`${process.env.PAYMENT_API_URL}/payment-plans`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${process.env.PAYMENT_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount: amount,
      name: name,
      interval: interval,
      duration: duration,
    }),
  })
    .then((response) => response.json())
    .then((json) => {
      const package_id = json.data.id;
      connection.query(
        `insert into packages (package_id , package_name, package_amount, package_interval,package_duration, package_des, status)
                values ('${package_id}', '${name}', '${amount}', '${interval}','${duration}' '${description}', 'active')`,
        (err, resp) => {
          if (err) {
            res.status(400).send("Internal Server Error");
          }
          res.status(200).send("Payment Plan created Successfully");

          // Audit Trail
          let trail = {
            actor: req.user.data.username,
            action: `created a new payment plan`,
            type: "success",
          };
          logTrail(trail);
        }
      );
    })
    .catch((err) => res.status(402).send("Payment Server Error"));
};

// Payment Initialization

const makePayment = (req, res) => {
  const name = req.user.data.firstName;
  const phone = req.user.data.tel;
  const email = req.user.data.email;
  const userID = req.user.data.id;
  const tx_ref = uuidv4();
  const { plan_id } = req.body;
  connection.query(
    `select package_amount, pid from packages where package_id = ${plan_id}`,
    (error, response) => {
      if (error) return res.status(400).send("Internal Server Error");
      let amount = response[0].package_amount;
      let packageID = response[0].pid;

      if (!amount || !packageID)
        return res.status(400).send("Invalid Package Selected");

      fetch(`${process.env.PAYMENT_API_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${process.env.PAYMENT_SECRET_KEY}`,
        },
        body: JSON.stringify({
          tx_ref: tx_ref,
          amount: amount,
          currency: "NGN",
          redirect_url: `${process.env.BASE_URL}/api/payment/verify-payment`,
          payment_options: "card",
          payment_plan: plan_id,
          customer: {
            email: email,
            phonenumber: phone,
            name: name,
          },
        }),
      })
        .then((response) => response.json())
        .then((json) => {
          connection.query(
            `insert into payment (userID, tx_ref, package_id, amount, status) values ('${userID}', '${tx_ref}', '${packageID}', '${amount}', 'pending')`,
            (err, resp) => {
              if (err) return res.status(400).send("Internal Server Error");
              res.status(200).send(json);

              // Audit Trail
              let trail = {
                actor: req.user.data.username,
                action: `Initiated a payment`,
                type: "success",
              };
              logTrail(trail);
            }
          );
        })
        .catch((err) => res.status(402).send("Payment Server Error"));
    }
  );
};

const verifyPayment = (req, res) => {
  var val = url.parse(req.url, true).query;
  const transaction_id = val.transaction_id;

  fetch(
    `${process.env.PAYMENT_API_URL}/transactions/${transaction_id}/verify`,
    {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${process.env.PAYMENT_SECRET_KEY}`,
      },
    }
  )
    .then((response) => response.json())
    .then((json) => {
      const transaction_ref = json.data.tx_ref;
      const amount = json.data.amount;
      const payment_type = json.data.payment_type;
      const status = json.data.status;
      connection.query(
        `select amount, status from payment where tx_ref = '${transaction_ref}'`,
        (error, resp) => {
          if (error) return res.status(400).send("Internal Server Error1");
          let payAmount = resp[0].amount;
          let statusDb = resp[0].status;
          if (amount == payAmount && statusDb == "pending") {
            connection.query(
              `UPDATE payment SET transaction_id = '${transaction_id}', payment_type = '${payment_type}', status = '${status}' where tx_ref = '${transaction_ref}'`,
              (err, response) => {
                if (err) return res.status(400).send("Internal Server Error2");
                connection.query(
                  `SELECT userID, package_duration, pid FROM packages INNER JOIN payment on packages.pid = payment.package_id WHERE tx_ref = '${transaction_ref}'`,
                  (error, respp) => {
                    if (error)
                      return res.status(400).send("Internal Server Error3");
                    let duration = respp[0].package_duration;
                    let userID = respp[0].userID;
                    let packageID = respp[0].pid;
                    connection.query(
                      `select * from subscription where userID = ${userID} AND package_id = ${packageID}`,
                      (error, responses) => {
                        if (responses.length === 0) {
                          sql = `SELECT TIMESTAMPADD(DAY,${duration},CURRENT_TIMESTAMP) AS endDate`;
                          connection.query(sql, (err, response1) => {
                            if (err)
                              return res
                                .status(400)
                                .send("Internal Server Error4");
                            let endDate = response1[0].endDate;
                            var newDate = endDate.toISOString();
                            var date = moment(newDate).format(
                              "YYYY-MM-DD H:mm:ss"
                            );
                            connection.query(
                              `insert into subscription (userID, package_id, end_date) values ('${userID}', '${packageID}', '${date}')`,
                              (err, resp) => {
                                if (err)
                                  return res
                                    .status(400)
                                    .send("Internal Server Error");
                                res.send(
                                  "Payment Successful And Subscription activated"
                                );

                                // Audit Trail
                                let trail = {
                                  actor: req.user.data.username,
                                  action: `subscribed to a package with id ${packageID}`,
                                  type: "success",
                                };
                                logTrail(trail);
                              }
                            );
                          });
                        } else {
                          let endDates = responses[0].end_date;
                          var endate = moment(endDates).format(
                            "YYYY-MM-DD H:mm:ss"
                          );
                          let todayDate = moment().format("YYYY-MM-DD H:mm:ss");
                          var newDate = endDates.toISOString();
                          var date = moment(newDate).format(
                            "YYYY-MM-DD H:mm:ss"
                          );
                          if (endate > todayDate) {
                            sql12 = `SELECT TIMESTAMPADD(DAY,${duration},'${date}') AS endDatez`;
                            connection.query(sql12, (err, response2) => {
                              if (err)
                                return res
                                  .status(400)
                                  .send("Internal Server Error");
                              let endDatez = response2[0].endDatez;
                              var datez = moment(endDatez).format(
                                "YYYY-MM-DD H:mm:ss"
                              );
                              connection.query(
                                `UPDATE subscription SET end_date = '${datez}' where userID = ${userID} AND package_id = ${packageID}`,
                                (err, resp) => {
                                  if (err)
                                    return res
                                      .status(400)
                                      .send("Internal Server Error");
                                  res.send(
                                    "Payment Successful And Subscription Extended"
                                  );

                                  // Audit Trail
                                  let trail = {
                                    actor: req.user.data.username,
                                    action: `extended their subscription to package with id ${packageID}`,
                                    type: "success",
                                  };
                                  logTrail(trail);
                                }
                              );
                            });
                          } else {
                            sql2 = `SELECT TIMESTAMPADD(DAY,${duration},CURRENT_TIMESTAMP) AS endDate, CURRENT_TIMESTAMP AS startDate`;
                            connection.query(sql2, (err, response2) => {
                              if (err)
                                return res
                                  .status(400)
                                  .send("Internal Server Error");
                              let endDate = response2[0].endDate;
                              let startDate = response2[0].startDate;
                              var endDates = endDate.toISOString();
                              var startDates = startDate.toISOString();
                              var endDatess = moment(endDates).format(
                                "YYYY-MM-DD H:mm:ss"
                              );
                              var startDatess = moment(startDates).format(
                                "YYYY-MM-DD H:mm:ss"
                              );
                              connection.query(
                                `UPDATE subscription SET end_date = '${endDatess}',  start_date = '${startDatess}' where userID = ${userID} AND package_id = ${packageID}`,
                                (err, resp) => {
                                  if (err)
                                    return res
                                      .status(400)
                                      .send("Internal Server Error");
                                  res.send(
                                    "Payment Successful And Subscription Re-activated"
                                  );

                                  // Audit Trail
                                  let trail = {
                                    actor: req.user.data.username,
                                    action: `Resubscribed to package with id ${packageID}`,
                                    type: "success",
                                  };
                                  logTrail(trail);
                                }
                              );
                            });
                          }
                        }
                      }
                    );
                  }
                );
              }
            );
          } else if (statusDb == "successful") {
            res.status(400).send("Payment already confirmed");
          } else {
            res.send("Error confirming payment");

            // Audit Trail
            let trail = {
              actor: req.user.data.username,
              action: `failed to verify user payment`,
              type: "danger",
            };
            logTrail(trail);
          }
        }
      );
    })
    .catch((err) => res.status(402).send("Payment Server Error"));
};

module.exports = {
  getPayment,
  createPlan,
  makePayment,
  verifyPayment,
};

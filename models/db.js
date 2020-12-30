const mysql = require("mysql"); // mysql module
var connection;
var dbConfig = {
  host: "us-cdbr-east-02.cleardb.com",
  user: "b83cbfeb7950d0",
  password: "24e38b68",
  database: "heroku_21d25399649ff1b",
};

function handleDisconnect() {
  connection = mysql.createConnection(dbConfig);

  connection.connect(function (err) {
    if (err) {
      console.log("error when connecting to db:", err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log("db server connected");
    }
  });

  connection.on("error", function (err) {
    console.log("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

module.exports = connection;

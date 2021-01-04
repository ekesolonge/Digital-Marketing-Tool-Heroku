const mysql = require("mysql"); // mysql module
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

var connection;

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

    //- The server close the connection.
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.log(
        `Cannot establish a connection with the database. ${err.code}`
      );
      connection.destroy();
      handleDisconnect();
    }

    //- Connection in closing
    else if (err.code === "PROTOCOL_ENQUEUE_AFTER_QUIT") {
      console.log(
        `Cannot establish a connection with the database. ${err.code}`
      );
      connection.destroy();
      handleDisconnect();
    }

    //- Fatal error : connection variable must be recreated
    else if (err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR") {
      console.log(
        `Cannot establish a connection with the database. ${err.code}`
      );
      connection.destroy();
      handleDisconnect();
    }

    //- Error because a connection is already being established
    else if (err.code === "PROTOCOL_ENQUEUE_HANDSHAKE_TWICE") {
      console.log(
        `Cannot establish a connection with the database. ${err.code}`
      );
    } else {
      throw err;
    }
  });
}

handleDisconnect();

module.exports = connection;

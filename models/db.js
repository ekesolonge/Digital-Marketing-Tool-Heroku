const mysql = require("mysql"); // mysql module

// Create SQL connection
const connection = mysql.createConnection({
  host: "us-cdbr-east-02.cleardb.com",
  user: "b83cbfeb7950d0",
  password: "24e38b68",
  database: "heroku_21d25399649ff1b",
});

// Test SQL connection
connection.connect((err, res) => {
  if (err) throw err;
  console.log("db server connected");
});

module.exports = connection;

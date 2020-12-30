const express = require("express"); // express module
const bodyParser = require("body-parser"); // body-parser middleware

const home = require("./routes/home");
const users = require("./routes/users");
const emailTemplate = require("./routes/emailTemplates");
const audience = require("./routes/audience");
const contactUs = require("./routes/contactUs");
const newsletter = require("./routes/newsletter");
const campaign = require("./routes/campaign");
const subscriber_group = require("./routes/subsciber_group");
const role = require("./routes/role");
const permission = require("./routes/permission");

const suggestions = require("./controllers/suggestions"); //Suggestions Controller
const reply = require("./controllers/reply"); //Reply Controller
const billing_info = require("./controllers/billing_info"); //Reply Controller
const payment = require("./controllers/payment"); // payment module
const stickyNote = require("./controllers/sticky_note"); // stickyNote module

const app = express(); // express init
app.use(bodyParser.json()); // Middleware use with express

// Routes
app.use("/", home);
app.use("/api/users", users);
app.use("/api/emailTemplates", emailTemplate);
// app.use("/api/audience", audience);
app.use("/api/contactUs", contactUs);
app.use("/api/newsletter", newsletter);
// app.use("api/campaign", campaign);
// app.use("api/subscriber_group", subscriber_group);
app.use("/api/role", role);
app.use("/api/permission", permission);
app.get("*", (req, res) => {
  res.send("Error 404 page doesn't exist");
});

suggestions(app);
reply(app);
billing_info(app);
payment(app);
stickyNote(app);

// Listen on port
const port = process.env.PORT || 3000; // set port
app.listen(port, () => console.log(`Listening on port ${port}...`));

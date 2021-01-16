const express = require("express"); // express module
const bodyParser = require("body-parser"); // body-parser middleware
const cors = require("cors"); // cors
const path = require("path"); // path

const home = require("./routes/home");
const users = require("./routes/users");
const emailTemplate = require("./routes/emailTemplates");
const audience = require("./routes/audience");
const contactUs = require("./routes/contactUs");
const newsletter = require("./routes/newsletter");
const campaign = require("./routes/campaign");
const subscriberGroup = require("./routes/subscriberGroup");
const role = require("./routes/role");
const permission = require("./routes/permission");
const suggestions = require("./routes/suggestions");
const reply = require("./routes/reply");
const billingInfo = require("./routes/billingInfo");
const payment = require("./routes/payment");
const stickyNote = require("./routes/stickyNote");

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "uploads")));

// CORS
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Routes
app.use("/", home);
app.use("/api/users", users);
app.use("/api/emailTemplates", emailTemplate);
app.use("/api/audience", audience);
app.use("/api/contactUs", contactUs);
app.use("/api/newsletter", newsletter);
app.use("/api/campaign", campaign);
app.use("/api/subscriberGroup", subscriberGroup);
app.use("/api/role", role);
app.use("/api/permission", permission);
app.use("/api/suggestions", suggestions);
app.use("/api/reply", reply);
app.use("/api/billingInfo", billingInfo);
app.use("/api/payment", payment);
app.use("/api/stickyNote", stickyNote);

// 404
app.use((req, res, next) => {
  res.status(404);
  res.send("Error 404 page doesn't exist");
});

// Listen on port
const port = process.env.PORT || 3000; // set port
app.listen(port, () => console.log(`Listening on port ${port}...`));

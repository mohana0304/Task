require("dotenv").config();

const express = require("express");
const path    = require("path");
const app     = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

const mapRoutes = require("./routes/mapRoutes");
app.use("/", mapRoutes);

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

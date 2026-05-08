const express = require("express");
const path = require("path");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
    res.render("purchase-orders");
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
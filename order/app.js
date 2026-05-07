const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require("./config/db");

const Order = require('./models/order');

const methodOverride = require('method-override');

const app = express();

app.set("view engine", "pug");
app.set("views", "./view");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(methodOverride('_method'));

sequelize.sync();

app.get('/', async (req, res) => {
    try {
        const orders = await Order.findAll();
        res.render("index", {orders,});
    } catch (err) {
        res.send(err.message);
    }
});

app.post('/orders', async (req, res) => {
    try {
        console.log("ORDER DATA:", req.body);
        delete req.body.id;
        const order = await Order.create(req.body);
        res.json({
            success: true,
            order
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

app.listen(3001, () => {
    console.log("server running on port 3001");
});
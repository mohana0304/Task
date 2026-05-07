const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require("./config/db");

const User = require('./models/user');
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
        const users = await User.findAll();
        const orders = await Order.findAll();
        res.render("index", {
            users,
            orders,
            // error: req.query.error || '',
            // success: req.query.success || ''
        });
    } catch (err) {
        res.send(err.message);
    }
});

app.post('/submit', async (req, res) => {
    try {
        delete req.body.id;
        await User.create(req.body);
        res.redirect('/?success=User Added Successfully');
    } catch (err) {
        console.log(err);
        res.redirect('/?error=Failed To Add User');
    }
});

app.put('/users/:id', async (req, res) => {
    try {
        await User.update(req.body, {
            where: {
                id: req.params.id
            }
        });
        res.redirect('/?success=User Updated Successfully');
    } catch (err) {
        console.log(err);
        res.redirect('/?error=Failed To Update User');
    }
});

app.get('/users/:id', async (req, res) => {
    try {
        const us = await User.findByPk(req.params.id);
        res.json(us);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
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
const express = require('express');
const app = express();

app.set('view engine', 'pug');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/chart', (req, res) => {
  res.render('chart');
});

app.get('/d3', (req, res) => {
  res.render('d3dashboard');
});

app.get('/echart', (req, res) => {
  res.render('echart');
});

app.get('/apex', (req, res) => {
  res.render('apexchart');
});

app.get('/flot', (req, res) => {
  res.render('flotchart');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
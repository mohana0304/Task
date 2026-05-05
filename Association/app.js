const express = require('express');
const app = express();
app.use(express.json());
const PORT=3010
const { sequelize} = require('./models');
sequelize.sync();
const userRoutes = require('./routes/userRoutes');
app.use('/api', userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require("express");
const db = require("./db");

const subscriberRoutes = require("../routes/subscriberRoutes")

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

console.log("Booting Bema CRM backend...");

app.get('/', async (req, res) => {
  try {
    await db.testConnection();
    res.json({ status: 'ok', service: 'Bema CRM backend', db: 'connected' });
  } catch (err) {
    console.error('Health check DB error:', err);
    res.status(500).json({ status: 'error', message: 'DB connection failed' });
  }
});


app.use('/api/subscribers', subscriberRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

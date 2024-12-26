const express = require('express');
const { default: mongoose } = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
require('dotenv').config();

// ROUTE IMPORTS
const notesRoute = require('./routes/notes');

// MIDDLEWARES
app.use(bodyParser.json());
app.use(cors());
app.use('/', notesRoute);

app.listen(process.env.PORT || 3000, () => {
  console.log('Server listening to Port ' + process.env.PORT);
});

// DB CONNECTION
mongoose
  .connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to DB');
  })
  .catch((err) => console.error(err));

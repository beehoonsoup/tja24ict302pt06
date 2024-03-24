process.env.TZ = 'Asia/Singapore';

const express = require('express');
const session = require('express-session');
const db = require('./config/db');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const homeRoutes = require('./routes/homeRoutes');
const projectRoutes = require('./routes/projectRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const biographyRoutes = require('./routes/biographyRoutes');
const testRoutes = require('./routes/testRoutes');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use('/public', express.static('public'));

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', homeRoutes);
app.use('/', projectRoutes);
app.use('/', feedbackRoutes);
app.use('/', biographyRoutes);
app.use('/', testRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

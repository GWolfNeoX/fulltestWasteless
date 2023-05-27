const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const Sequelize = require('sequelize');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());

// Konfigurasi Sequelize
const sequelize = new Sequelize('railway', 'root', 'Gs8VmfdCJU8x6pv24vLi', {
  host: 'containers-us-west-29.railway.app',
  port: 7818,
  dialect: 'mysql'
});

// Model User
const User = sequelize.define('user', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  timestamps: false, // Menghilangkan kolom createdAt dan updatedAt
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 hari dalam milidetik
  },
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

const authenticate = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Silahkan login/register terlebih dahulu' });
  }
};

// Konfigurasi Google Cloud Storage
const storage = new Storage({
  projectId: 'wasteless-387810',
  keyFilename: './wasteless-credentials.json',
});

const bucketName = 'wasteless-test';

// Konfigurasi multer
const storageMulter = multer.memoryStorage();
const upload = multer({ storage: storageMulter });

// Routes
app.get('/homepage', authenticate, (req, res) => {
  const name = req.session.user.name;
  return res.send(`Selamat datang ${name}`);
});

app.post('/register', [
  check('name').notEmpty(),
  check('email').isEmail(),
  check('password').isLength({ min: 6 }),
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  // Cek apakah email sudah digunakan sebelumnya
  User.findOne({
    where: {
      email: email,
    }
  })
    .then((existingUser) => {
      if (existingUser) {
        // Jika email sudah digunakan
        return res.status(400).json({ error: 'Email sudah digunakan' });
      }

      // Enkripsi password menggunakan bcrypt
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) throw err;

          User.create({
              name,
              email,
              password: hash,
            })
              .then(() => res.status(201).json({ message: 'User created successfully' }))
              .catch((err) => next(err));
             // Menggunakan next(err) untuk menangani error
        });
      });
    })
    .catch((err) => next(err)); // Menggunakan next(err) untuk menangani error
});

// Middleware untuk menangani error
app.use((err, req, res, next) => {
  console.error(err); // Cetak error ke konsol
  res.status(500).json({ error: 'Terjadi kesalahan server' });
});

app.post('/login', [
  // Validasi input saat login
  check('email').isEmail(),
  check('password').notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  User.findOne({ where: { email } })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: 'email/password kamu salah. Silahkan coba lagi.' });
      }

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;

        if (isMatch) {
          // Set session untuk user yang berhasil login
          req.session.user = user;
          return res.json({ message: 'Login berhasil' });
        } else {
          return res.status(401).json({ error: 'email/password kamu salah. Silahkan coba lagi.' });
        }
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Logout successful' });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});

const express = require('express');
const multer = require('multer');
const mysql = require('mysql');
const { Storage } = require('@google-cloud/storage');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const Sequelize = require('sequelize');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());

// Konfigurasi Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
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

// Model Food Donation
const Food = sequelize.define('food', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  fotoMakanan: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  foodName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  location: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  latitude: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  longitude: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  expiredAt: {
    type: Sequelize.DATE,
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

// Configure multer storage and file filter
const storageMulter = multer.memoryStorage();
const upload = multer({ storage: storageMulter });

// Konfigurasi Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEYFILE,
});
const bucketName = process.env.GCS_BUCKET_NAME;

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Middleware for parsing URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Helper function to filter files by JPG extension
function jpgFileFilter(req, file, cb) {
  if (file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(new Error('Only JPG files are allowed'));
  }
}

// Routes
// Halaman untuk Homepage
app.get('/homepage', authenticate, (req, res) => {
  const name = req.session.user.name;
  return res.render(`homepage`);
});

// Test Register
app.get('/register', (req, res) => {
  res.render('register');
});

// Rute API untuk register '/register'
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

// Test Login
app.get('/login', (req, res) => {
  res.render('login');
});

// Rute API untuk Login '/login'
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

// Rute API untuk Logout '/logout'
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Test postfood
app.get('/postfood', (req, res) => {
  res.render('index');
});

// Rute API posting makanan '/postFood'
app.post('/postFood', upload.single('fotoMakanan'), async (req, res, next) => {
  try {
    const { foodName, description, quantity, location, expiredAt } = req.body;
    const file = req.file;

    // Validasi input
    const errors = [];
    if (!foodName || !description || !quantity || !location || !expiredAt) {
      errors.push({ msg: 'Semua field harus diisi' });
    }

    if (!file) {
      errors.push({ msg: 'Foto makanan harus diupload' });
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Generate a random filename using UUID and add the .jpg extension
    const filename = `${uuidv4()}.jpg`;

    // Upload foto makanan ke Google Cloud Storage with the generated filename
    const blob = storage.bucket(bucketName).file(`foodDonation/${filename}`); // Specify the "uploads" folder in the file path
    const blobStream = blob.createWriteStream();

    blobStream.on('error', (err) => {
      next(err);
    });

    blobStream.on('finish', async () => {
      try {
        // Generate signed URL untuk foto makanan
        const signedUrls = await blob.getSignedUrl({
          action: 'read',
          expires: '01-01-2025', // Tanggal expired URL
        });

        const fotoMakanan = signedUrls[0];

        // Mendapatkan koordinat lokasi menggunakan Gmaps API
        const gmapsApiKey = process.env.GMAPS_API_KEY;
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${gmapsApiKey}`);
        const { results } = response.data;

        if (results.length === 0) {
          return res.status(400).json({ error: 'Lokasi tidak valid' });
        }

        const { formatted_address, geometry } = results[0];
        const { lat, lng } = geometry.location;

        // Upload berhasil, simpan alamat foto ke database
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;

        Food.create({
          fotoMakanan: publicUrl,
          foodName,
          description,
          quantity,
          location: formatted_address,
          latitude: lat,
          longitude: lng,
          expiredAt,
        })
          .then(() => res.render('success'))
          .catch((err) => next(err));
      } catch (error) {
        next(error);
      }
    });

    blobStream.end(file.buffer);
  } catch (error) {
    next(error);
  }
});

// Rute API melihat detail makanan yang tersedia '/foodDetail'
app.get('/fooddetail/:id', (req, res)=>{
  const {id} = req.params;
  
  Food.findOne({where:{id:id}})
  .then(Food =>{
    if(Food){
      res.json(Food.toJSON());
    } else {
      res.status(404).json({error: 'Data makanan tidak ditemukan'});
    }
  })
  .catch(err =>{
    res.status(500).json({error: 'Internal server error'});
  });
});

// Middleware penanganan kesalahan
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error');
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});

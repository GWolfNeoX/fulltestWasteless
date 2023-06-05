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
const moment = require('moment');

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
  historyDonation: {
    type: Sequelize.STRING,
    allowNull: true,
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
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
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
    res.status(401).json({ error: 'Please login/register first' });
  }
};

// Configure multer storage and file filter
const storageMulter = multer.memoryStorage();
const upload = multer({ storage: storageMulter });

// Configure Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEYFILE,
});
const bucketName = process.env.GCS_BUCKET_NAME;

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
// Homepage page
app.get('/homepage', authenticate, (req, res) => {
  const name = req.session.user.name;
  res.json({ message: 'Homepage' });
});

// API route for register '/register'
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

  // Get location using Google Maps API
  const location = req.body.location;
  const gmapsApiKey = process.env.GMAPS_API_KEY;
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${gmapsApiKey}`;

  axios.get(geocodeUrl)
    .then(response => {
      const { results } = response.data;
      if (results.length === 0) {
        return res.status(400).json({ error: 'Invalid location' });
      }

      const { lat, lng } = results[0].geometry.location;
      const formattedLocation = results[0].formatted_address;

      // Check if email is already used
      User.findOne({
        where: {
          email: email,
        }
      })
        .then((existingUser) => {
          if (existingUser) {
            // If email is already used
            return res.status(400).json({ error: 'Email is already used' });
          }

          // Encrypt password using bcrypt
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
              if (err) throw err;

              User.create({
                name,
                email,
                password: hash,
                location: formattedLocation,
                latitude: lat,
                longitude: lng,
              })
                .then(() => res.status(201).json({ message: 'User created successfully' }))
                .catch((err) => next(err));
            });
          });
        })
        .catch((err) => next(err));
    })
    .catch((err) => next(err));
});

// API route for login '/login'
app.post('/login', [
  // Input validation for login
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
        return res.status(401).json({ error: 'Invalid email/password. Please try again.' });
      }

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;

        if (isMatch) {
          // Set session for the successfully logged in user
          req.session.user = user;
          return res.json({ message: 'Login successful' });
        } else {
          return res.status(401).json({ error: 'Invalid email/password. Please try again.' });
        }
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// API route for logout '/logout'
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Logout successful' });
  });
});

// API route for posting food '/postFood'
app.post('/postFood', authenticate, upload.single('fotoMakanan'), async (req, res, next) => {
  try {
    const { foodName, description, quantity, location, expiredAt } = req.body;
    const expiredDateTime = moment(expiredAt).toDate();
    const file = req.file;

    // Input validation
    const errors = [];
    if (!foodName || !description || !quantity || !location || !expiredAt) {
      errors.push({ msg: 'All fields must be filled' });
    }

    if (!file) {
      errors.push({ msg: 'Food photo must be uploaded' });
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Generate a random filename using UUID and add the .jpg extension
    const filename = `${uuidv4()}.jpg`;

    // Upload food photo to Google Cloud Storage with the generated filename
    const blob = storage.bucket(bucketName).file(`foodDonation/${filename}`); // Specify the "uploads" folder in the file path
    const blobStream = blob.createWriteStream();

    blobStream.on('error', (err) => {
      next(err);
    });

    blobStream.on('finish', async () => {
      try {
        // Generate signed URL for the food photo
        const signedUrls = await blob.getSignedUrl({
          action: 'read',
          expires: '01-01-2025', // Expiration date for the URL
        });

        const fotoMakanan = signedUrls[0];

        // Get location coordinates using Gmaps API
        const gmapsApiKey = process.env.GMAPS_API_KEY;
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${gmapsApiKey}`);
        const { results } = response.data;

        if (results.length === 0) {
          return res.status(400).json({ error: 'Invalid location' });
        }

        const { formatted_address, geometry } = results[0];
        const { lat, lng } = geometry.location;

        // Upload successful, save the photo URL to the database
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;

        Food.create({
          fotoMakanan: publicUrl,
          foodName,
          description,
          quantity,
          location: formatted_address,
          latitude: lat,
          longitude: lng,
          expiredAt: expiredDateTime,
        })
          .then(() => {
            // Update user's donation history
            const userId = req.session.user.id;
            User.findByPk(userId)
              .then((user) => {
                if (user) {
                  const currentHistory = user.historyDonation || ''; // Current donation history
                  const newHistory = `${currentHistory}\n${foodName} - ${new Date()}`; // Add the new donation
                  user.update({ historyDonation: newHistory })
                    .then(() => {
                      res.status(200).json({ message: 'Food donation posted successfully' });
                    })
                    .catch((err) => next(err));
                }
              })
              .catch((err) => next(err));
          })
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

// API route for viewing available food list
app.get('/foodList', (req, res) =>{
  Food.findAll({
    attributes: ['id','foodName','fotoMakanan','latitude','longitude']
  })
  .then((food)=>{
    res.json(food);
  })
})

// API route for viewing details of a specific available food '/foodDetail'
app.get('/foodDetail/:id', authenticate, (req, res) => {
  const foodId = req.params.id;

  Food.findOne({ where: { id: foodId } })
    .then((food) => {
      if (food) {
        res.json(food.toJSON());
      } else {
        res.status(404).json({ error: 'Food data not found' });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: 'Internal server error' });
    });
});

// Endpoint for search feature
app.get('/food/search', async (req, res) => {
  const searchQuery = req.query.q;

  Food.findAll({ where: { name: {[Sequelize.Op.like]: `%${searchQuery}%`}} })
    .then((foods) => {
      if (foods) {
        res.json(foods.toJSON());
      } else {
        res.status(404).json({ error: 'Food data not found' });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: 'Internal server error' });
    });
});

// API route for viewing user profile details '/userProfile'
app.get('/userProfile', authenticate, (req, res) => {
  const userId = req.session.user.id;

  User.findOne({ where: { id: userId } })
    .then((user) => {
      if (user) {
        res.json(user.toJSON());
      } else {
        res.status(404).json({ error: 'User data not found' });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: 'Internal server error' });
    });
});

// Endpoint for chat feature


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

setInterval(() => {
  const currentTime = moment().toDate();

  Food.destroy({
    where: {
      expiredAt: {
        [Sequelize.Op.lt]: currentTime,
      },
    },
  })
    .then((deletedCount) => {
      console.log(`Deleted ${deletedCount} expired food items`);
    })
    .catch((err) => {
      console.error('Error deleting expired food items:', err);
    });
}, 24 * 60 * 60 * 1000); // Run every 24 hours
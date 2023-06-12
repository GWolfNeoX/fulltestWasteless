const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const Sequelize = require('sequelize');
const cors = require('cors');
const moment = require('moment');
const path = require('path');
const { QueryTypes } = require('sequelize');
const jwt = require('jsonwebtoken');

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
  userId: {
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
    allowNull: true,
  },
  fotoProfile: {
    type: Sequelize.STRING,
    allowNull: true,
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
  foodId: {
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
    type: Sequelize.STRING,
    allowNull: true,
  },
  longitude: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  expiredAt: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  foodType: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  timestamps: false, // Menghilangkan kolom createdAt dan updatedAt
});

// Model History
const History = sequelize.define('history', {
  historyId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  userId_peminat: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  foodId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  userId_donatur: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  status: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  },
}, {
  timestamps: false, // Menghilangkan kolom createdAt dan updatedAt
});

// Konfigurasi Relasi
Food.belongsTo(User, { foreignKey: 'userId' }); // Food memiliki relasi belongsTo dengan User
User.hasMany(Food, { foreignKey: 'userId' }); // User memiliki relasi hasMany dengan Food

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(flash());

// Configure multer storage and file filter
const storageMulter = multer.memoryStorage();
const upload = multer({ storage: storageMulter });

// Configure Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEYFILE,
});
const bucketName = process.env.GCS_BUCKET_NAME;

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
app.get('/homepage', authenticateToken, (req, res) => {
  const name = req.user.name;
  res.json({ message: `Welcome, ${name}! This is the homepage.` });
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
          })
            .then(() => res.status(201).json({ message: 'User created successfully' }))
            .catch((err) => next(err));
        });
      });
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

  const { name, email, password } = req.body;

  User.findOne({ where: { email } })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: 'Invalid email/password. Please try again.' });
      }

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;

        if (isMatch) {
          // Generate JWT token
          const token = generateToken(user);

          res.json({ userId: user.userId, name, email, token });
        } else {
          return res.status(401).json({ error: 'Invalid email/password. Please try again.' });
        }
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// API route for posting food '/postFood'
app.post('/postFood', authenticateToken, upload.single('fotoMakanan'), async (req, res, next) => {
  try {
    const { foodName, description, quantity, location, expiredAt, foodType } = req.body;
    const expiredDateTime = moment(expiredAt, 'DD-MM-YYYY').toDate(); // Format tanggal menjadi dd-mm-yyyy
    const file = req.file;

    // Input validation
    const errors = [];
    if (!foodName || !description || !quantity || !location || !expiredAt || !foodType) {
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

    // Get location coordinates using Gmaps API
    const gmapsApiKey = process.env.GMAPS_API_KEY;
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${gmapsApiKey}`);
    const { results } = response.data;

    if (results.length === 0) {
      return res.status(400).json({ error: 'Invalid location' });
    }

    const { geometry } = results[0];
    const { lat, lng } = geometry.location;

    // Upload food photo to Google Cloud Storage with the generated filename
    const blob = storage.bucket(bucketName).file(`foodDonation/${filename}`);
    const blobStream = blob.createWriteStream();

    blobStream.on('error', (err) => {
      next(err);
    });

    blobStream.on('finish', async () => {
      try {
        // Generate signed URL for the food photo
        const signedUrls = await blob.getSignedUrl({
          action: 'read',
          expires: '01-01-2025',
        });

        const fotoMakanan = signedUrls[0];

        // Get location coordinates using Gmaps API
        const gmapsApiKey = process.env.GMAPS_API_KEY;
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${gmapsApiKey}`);
        const { results } = response.data;

        if (results.length === 0) {
          return res.status(400).json({ error: 'Invalid location' });
        }

        const { geometry } = results[0];
        const { lat, lng } = geometry.location;

        // Determine foodstatus based on quantity
        let foodstatus;
        if (quantity > 0) {
          foodstatus = 'tersedia';
        } else {
          foodstatus = 'habis';
        }

        // Upload successful, save the photo URL, food type, and foodstatus to the database
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;

        // Get userId and name from req.user
        const userId = req.user.userId;
        const name = req.user.name;

        Food.create({
          fotoMakanan: publicUrl,
          foodName,
          description,
          quantity,
          location,
          latitude: lat,
          longitude: lng,
          expiredAt: expiredDateTime,
          foodType,
          userId, // Save userId in the database
          name, // Save name in the database
        })
          .then(() => {
            // Update user's donation history
            const userId = req.user.userId;
            User.findByPk(userId)
              .then((user) => {
                if (user) {
                  const currentHistory = user.historyDonation || '';
                  const newHistory = `${currentHistory}\n${foodName} - ${moment().format('DD-MM-YYYY')}`; // Format tanggal saat ini menjadi dd-mm-yyyy
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

// Get all history
app.get('/history', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  // Retrieve history data from the database
  History.findAll({ where: { userId_peminat: userId } })
    .then((history) => {
      res.json(history);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// Create history
app.post('/history', authenticateToken, (req, res) => {
  const { userId_peminat, foodId, userId_donatur, status } = req.body;

  // Create a new history entry in the database
  History.create({
    userId_peminat,
    foodId,
    userId_donatur,
    status
  })
    .then(() => {
      res.status(201).json({ message: 'Berhasil request makanan' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// Update history by ID
app.put('/history/:id', authenticateToken, (req, res) => {
  const historyId = req.params.id;
  const { status } = req.body;

  // Update the status of the history entry in the database
  History.update({ status }, { where: { historyId } })
    .then(() => {
      // Retrieve the updated history entry
      return History.findByPk(historyId);
    })
    .then((history) => {
      const userId_peminat = history.userId_peminat;
      res.json({
        message: `Makanan telah dibagikan ke ${userId_peminat}`,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// API route for viewing food list by userId '/foodList/userId'
app.get('/foodList/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;

  Food.findAll({
    attributes: ['foodId', 'name', 'expiredAt', 'fotoMakanan', 'userId'],
    where: {
      userId: userId,
    },
  })
    .then((food) => {
      if (food.length === 0) {
        res.status(200).json({ message: 'Tidak ada makanan yang didonasikan oleh pengguna ini' });
      } else {
        res.json(food);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// API route for viewing available food list '/foodList' //ERROR
app.get('/foodList', authenticateToken, async (req, res) => {
    try {
      // Get User ID from authenticationToken
      const userId = get_user_id_from_auth_token(authenticateToken);
      
      // Get ML parameter
      const foodTypes = await sequelize.query(
        `SELECT f.foodType FROM history h
         JOIN food f ON f.foodId = h.foodId
         JOIN user u ON u.userId = h.userId_peminat
         WHERE u.userId = :userID`,
        {
          replacements: { userId: userId },
          type: QueryTypes.SELECT,
        }
      );
  
      const parameterML = new Map();
      parameterML.set("ayam_dagingT", 0);
      parameterML.set("ikan_seafoodT", 0);
      parameterML.set("tahu_tempe_telurT", 0);
      parameterML.set("sayurT", 0);
      parameterML.set("sambalT", 0);
      parameterML.set("nasi_mie_pastaT", 0);
      parameterML.set("sop_soto_baksoT", 0);
      parameterML.set("kue_rotiT", 0);
      parameterML.set("jajanan_pasarT", 0);
      parameterML.set("puding_jeliT", 0);
      parameterML.set("keripik_kerupukT", 0);
      parameterML.set("buah_minumanT", 0);
  
      for (const f of foodTypes) {
        if (f.foodType === 'ayam_dagingT') {
          parameterML.set("ayam_dagingT", parameterML.get("ayam_dagingT") + 1);
        } else if (f.foodType === 'ikan_seafoodT') {
          parameterML.set("ikan_seafoodT", parameterML.get("ikan_seafoodT") + 1);
        } else if (f.foodType === 'tahu_tempe_telurT') {
          parameterML.set("tahu_tempe_telurT", parameterML.get("tahu_tempe_telurT") + 1);
        } else if (f.foodType === 'sayurT') {
          parameterML.set("sayurT", parameterML.get("sayurT") + 1);
        } else if (f.foodType === 'sambalT') {
          parameterML.set("sambalT", parameterML.get("sambalT") + 1);
        } else if (f.foodType === 'nasi_mie_pastaT') {
          parameterML.set("nasi_mie_pastaT", parameterML.get("nasi_mie_pastaT") + 1);
        } else if (f.foodType === 'sop_soto_baksoT') {
          parameterML.set("sop_soto_baksoT", parameterML.get("sop_soto_baksoT") + 1);
        } else if (f.foodType === 'kue_rotiT') {
          parameterML.set("kue_rotiT", parameterML.get("kue_rotiT") + 1);
        } else if (f.foodType === 'jajanan_pasarT') {
          parameterML.set("jajanan_pasarT", parameterML.get("jajanan_pasarT") + 1);
        } else if (f.foodType === 'puding_jeliT') {
          parameterML.set("puding_jeliT", parameterML.get("puding_jeliT") + 1);
        } else if (f.foodType === 'keripik_kerupukT') {
          parameterML.set("keripik_kerupukT", parameterML.get("keripik_kerupukT") + 1);
        } else if (f.foodType === 'buah_minumanT') {
          parameterML.set("buah_minumanT", parameterML.get("buah_minumanT") + 1);
        }
      }
  
      // API call ke API ML
      const preferensi_user = await http.post('https://wasteless-api-v1-ywnxbyxnda-et.a.run.app/', parameterML); // Example
  
      // Ambil seluruh makanan dari database
      const foods = await Food.findAll({
        where: {
          foodType: preferensi_user,
        },
        limit: 4,
      });
  
      // Memunculkan semua makanan
      if (foods.length === 0) {
        res.status(200).json({ message: 'Tidak ada makanan yang didonasikan' });
      } else {
        res.json(foods);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });  

// API route for viewing details of a specific available food '/foodDetail/:id'
app.get('/foodDetail/:id', authenticateToken, (req, res) => {
  const foodId = req.params.id;

  Food.findOne({ where: { foodId } })
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
});// API route for viewing details of a specific available food '/foodDetail/:id'
app.get('/foodDetail/:id', authenticateToken, (req, res) => {
  const foodId = req.params.id;

  Food.findOne({ where: { foodId } })
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

// API route for viewing user profile details '/userProfile'
app.get('/userProfile', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  User.findOne({ where: { userId } })
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

// API route for updating user profile '/userProfile'
app.put('/userProfile', authenticateToken, upload.single('fotoProfile'), async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { location } = req.body;
    const file = req.file;

    // Input validation
    if (!location) {
      return res.status(400).json({ error: 'Location field must be filled' });
    }

    let fotoProfile = null;
    if (file) {
      // Generate a random filename using UUID and add the .jpg extension
      const filename = `${uuidv4()}.jpg`;

      // Upload profile photo to Google Cloud Storage with the generated filename
      const blob = storage.bucket(bucketName).file(`profilePhotos/${filename}`);
      const blobStream = blob.createWriteStream();

      blobStream.on('error', (err) => {
        next(err);
      });

      blobStream.on('finish', async () => {
        try {
          // Generate public URL for the profile photo
          const publicUrl = `https://storage.googleapis.com/wasteless-buckets/profilePhotos/${filename}`;

          // Update user's profile in the database
          User.update({ location, fotoProfile: publicUrl }, { where: { userId } })
            .then(() => {
              res.status(200).json({ message: 'User profile updated successfully' });
            })
            .catch((err) => next(err));
        } catch (error) {
          next(error);
        }
      });

      blobStream.end(file.buffer);
    } else {
      // Update user's profile in the database without changing the fotoProfile
      User.update({ location }, { where: { userId } })
        .then(() => {
          res.status(200).json({ message: 'User profile updated successfully' });
        })
        .catch((err) => next(err));
    }
  } catch (error) {
    next(error);
  }
});

// Middleware to authenticate the token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = user;
    next();
  });
}

function get_user_id_from_auth_token(token) {
  try {
    // Ensure the token is provided as a string
    if (typeof token !== 'string') {
      throw new Error('Invalid token');
    }

    // Verify and decode the token to get the user ID
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return decodedToken.userId;
  } catch (error) {
    // Handle token verification error
    console.error('Token verification error:', error);
    return null;
  }
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign({ userId: user.userId, name: user.name, email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
}

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

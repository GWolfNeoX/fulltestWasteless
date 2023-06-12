// API route for viewing available food list '/foodList'
app.get('/foodList', authenticateToken, async (req, res) => {
  try {
    // Get User ID from authenticationToken
    const userID = get_user_id_from_auth_token(authenticateToken);

    // Get ML parameter
    const foodTypes = await sequelize.query(
      `SELECT f.foodType FROM history h
       JOIN food f ON f.foodId = h.foodId
       JOIN user u ON u.userId = h.userId_peminat
       WHERE u.userId = :userID`,
      {
        replacements: { userID: userID },
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
    Food.findWhere({
      foodType: preferensi_user
    }).take(4);

    // Memunculkan semua makanan
    Food.findAll({
      attributes: ['foodId', 'fotoMakanan', 'foodName', 'description', 'quantity', 'location', 'latitude', 'longitude', 'expiredAt', 'foodType']
    })
      .then((food) => {
        if (food.length === 0) {
          res.status(200).json({ message: 'Tidak ada makanan yang didonasikan' });
        } else {
          res.json(food);
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
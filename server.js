require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const shortSchema = new Schema({
  original_url: String,
  short_url: Number,
});

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let Short;
Short = mongoose.model('Short', shortSchema);

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.route('/api/shorturl?/:short?').get(function(req, res) {
  if (!req.params.short) {
    res.send('Not found');
    return;
  }
  Short.findOne({ short_url: req.params.short }, function (err, doc) {
    if (err) {
      res.json({ error: JSON.stringify(err) });
      return;
    }
    if (!doc) {
      res.send('Not found');
    } else {
      res.redirect(doc.original_url);
    }   
  });
}).post(function(req, res) {
  Short.findOne({ original_url: req.body.url }, async function (err, doc) {
    if (err) {
      res.json({ error: JSON.stringify(err) });
      return;
    }
    try {
      const url = new URL(req.body.url);
      if (url.protocol !== "http:" || url.protocol !== "https:") {
        throw new Error('invalid url');
      }
    } catch (err) {
      res.json({ error: 'invalid url' });
      return;
    }
    if (!doc) {
      const docCount = await Short.find().estimatedDocumentCount().exec();
      const short = new Short({ original_url: req.body.url, short_url: parseInt(docCount) + 1 });
      short.save(function(err, data) {
        res.json({ original_url: data.original_url, short_url: data.short_url });
      });
    } else {
      res.json({ original_url: doc.original_url, short_url: doc.short_url });
    }   
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

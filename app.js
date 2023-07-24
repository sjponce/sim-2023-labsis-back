var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    methodOverride  = require("method-override"),
    mongoose        = require('mongoose'),
    cors            = require('cors');
// Connection to DB
mongoose.connect('mongodb://127.0.0.1:27017/rows');

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());

// Import Models and controllers
var models     = require('./models/row')(app, mongoose);
var RowCtrl = require('./controllers/row');
app.use(cors());

// Example Route
var router = express.Router();
router.get('/', function(req, res) {
  res.send("Hello world!");
});
app.use(router);
app.options('*', cors())
// API routes
var rows = express.Router();

rows.route('/rows')
.get(RowCtrl.findAll);

rows.route('/generate')
.get(RowCtrl.generate);


app.use('/api', rows);

// Start server
app.listen(3000, function() {
  console.log("Node server running on http://localhost:3000");
});
const express = require("express");
const app = express();
const mongoose = require("mongoose");

app.listen(5000, (err) => {
  if (!err) console.log("server connected to port 5000");
});
app.use(express.static(__dirname));
console.log(__dirname, "rfwerwerewrwerwe");
const multer = require("multer");

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  },
});

let upload = multer({ storage: storage });

app.use((req, res, next) => {
  res.header("Access-Control-Allow-orgin", "*");
  res.header("Access-Control-Allow-Header", "Content-Type,Authorization");
  if (req.method === "OPTION") {
    res.header("Access-Control-Allow-Method", "GET,POST,PUT,PATCH,DELETE");
    return res.status(200).json();
  }
  next();
});

//   let error = new Error("not found");
//   error.status = 404;
//   next(error);
// });

// app.use((err, req, res, next) => {
//   let status = err.status ? err.status : 404;
//   res.status(status).json({
//     error: err.message,
//     status: err.status,
//   });
//   next()
// });

mongoose.connect("mongodb://localhost:27017", {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  autoIndex: true, //make this also true
});
db = mongoose.connection;
db.on("error", (err) => {
  console.log("connection lost", err);
});
db.once("open", () => {
  console.log("db connected to server");
});
const schema = mongoose.Schema(
  {
    _id: {
      type: mongoose.Types.ObjectId,
    },
    heading: {
      type: String,
      required: [true, " heading not be empty"],
    },
    read_time: {
      type: String,
      validate: {
        validator: (val) => {
          return /^[0-9.,]+$/.test(val);
        },
        message: (props) => {
          return (
            props.value +
            " only permit digits and '.,' characters  (provide in minutes)"
          );
        },
      },
      required: [true, " read_time not be empty"],
    },
    description: {
      type: String,
      required: [true, " description not be empty"],
    },
    categories: {
      type: [String],
      required: [true, "category not be empty"],
    },
    verified: {
      type: Boolean,
      default: true,
    },
    trending: {
      type: Boolean,
      default: false,
    },
    newest: {
      type: Boolean,
      default: true,
    },
    path: String,
  },
  { collection: "articles", versionKey: false }
);
const art = mongoose.model("article", schema);

app.post("/create_article", upload.array("image"), (req, res) => {
  console.log(req.files[0].path);
  req.body.path = req.files[0].path;

  if (req.body.categories) {
    req.body.categories = req.body.categories.split(",");
  }

  req.body._id = new mongoose.Types.ObjectId();

  const article = new art(req.body);
  article
    .save()
    .then((data) => {
      console.log(data);
      res.json({ err: false, data: { id: data._id } });
    })
    .catch((err) => {
      console.log(err);
      res.json({ err: true, data: err });
    });
});

app.post("/push_category/:id", upload.none(), (req, res) => {
  id = req.params.id;
  const categories = req.body.categories.split(",");
  art
    .findByIdAndUpdate(
      { _id: id },
      { $push: { categories: { $each: categories } } }
    )
    .exec()
    .then((data) => {
      console.log(data);
      res.json({ err: false });
    })
    .catch((err) => {
      res.json({ err: true });
    });
});

app.get("/get_category/:id", upload.none(), (req, res) => {
  id = req.params.id;
  const categories = req.body.categories.split(",");
  art
    .findOne({ _id: id })
    .select("categories -_id")
    .exec()
    .then((data) => {
      console.log(data);
      res.json({ err: false, data });
    })
    .catch((err) => {
      res.json({ err: true });
    });
});

app.get("/get_articles", upload.none(), (req, res) => {
  art
    .find()
    .then((data) => {
      console.log(data);
      res.json({ err: false, data });
    })
    .catch((err) => {
      console.log(err);
      res.json({ err: true });
    });
});

app.get("/get_category_article", upload.none(), (req, res) => {
  const categories = req.body.categories.split(",");

  art
    .find({ categories: { $in: categories } })
    .then((data) => {
      console.log(data);
      res.json({ err: false, data });
    })
    .catch((err) => {
      console.log(err);
      res.json({ err: true });
    });
});

app.delete("/artcle/:id", upload.none(), (req, res) => {
  const id = req.params.id;
  art
    .findByIdAndDelete({ _id: id })
    .then((data) => {
      console.log(data);
      res.json({ err: false });
    })
    .catch((err) => {
      console.log(err);
      res.json({ err: true });
    });
});

app.put("/edit_article/:id", upload.array("image"), (req, res) => {
  console.log(req.files[0].path);
  const id = req.params.id;
  req.body.path = req.files[0].path;
  if (req.body.categories) {
    req.body.categories = req.body.categories.split(",");
  }
  
  
  let content = req.body;
  content.newest = false;
  art
    .findByIdAndUpdate(
      { _id: id },
      { $set: content }
    )
    .then((data) => {
      console.log(data);
      res.json({ err: false, data: { id: data._id } });
    })
    .catch((err) => {
      console.log(err);
      res.json({ err: true, data: err });
    });
});

const express = require("express");
const { ObjectId } = require("mongodb");
const elasticlunr = require("elasticlunr");
const mc = require("mongodb").MongoClient;
let dbData;

const app = express();

app.use(express.static("public"));
app.set("view engine", "pug");

//Automatically parse JSON data
app.use(express.json());

//Create your index
//Specify fields you want to include in search
//Specify reference you want back (i.e., page ID)
const index = elasticlunr(function () {
  this.addField("title");
  this.addField("link");
  this.addField("children");
  this.addField("content");
  this.setRef("_id");
});

app.get("/", function (req, res, next) {
  let query = req.query.search;
  if (!query) {
    res.status(200);
    res.format({
      html: function () {
        res.render("index", { results: [], resultCount: 0 });
      },
      json: function () {
        res.send(JSON.stringify([]));
      },
    });
    return;
  }
  let result = index.search(query, {
    fields: {
      title: { boost: 2 },
      content: { boost: 1 },
    },
    bool: "AND",
  });
  let resultCount = result.length;
  result = result.slice(0, 10);
  let resultObjArr = [];
  result.forEach((doc) => {
    let docResult = index.documentStore.getDoc(doc.ref);
    docResult.score = doc.score;
    resultObjArr.push(docResult);
  });
  res.status(200);
  res.format({
    html: function () {
      res.render("index", { results: resultObjArr, resultCount: resultCount });
    },
    json: function () {
      res.send(JSON.stringify(resultObjArr));
    },
  });
});

// connecting our database.
mc.connect("mongodb://localhost:27017", function (err, client) {
  if (err) {
    console.log("Error in connecting to database");
    console.log(err);
    return;
  }
  db = client.db("store");

  db.collection("links")
    .find()
    .toArray(function (err, result) {
      if (err) {
        console.log("Error reading database.");
        return;
      }
      result.forEach((doc) => {
        index.addDoc(doc);
      });
      app.listen(3000);
      console.log("Server running at http://localhost:3000/");
    });
});

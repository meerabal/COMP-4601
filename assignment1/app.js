const express = require("express");
const { ObjectId } = require("mongodb");
const elasticlunr = require("elasticlunr");
const mc = require("mongodb").MongoClient;

const app = express();

app.use(express.static("public"));
app.set("view engine", "pug");

//Automatically parse JSON data
app.use(express.json());

const personalIndex = elasticlunr(function () {
  this.addField("title");
  this.addField("link");
  this.addField("incoming");
  this.addField("outgoing");
  this.addField("content");
  this.addField("pageRank");
  this.setRef("_id");
});

const fruitsIndex = elasticlunr(function () {
  this.addField("title");
  this.addField("link");
  this.addField("incoming");
  this.addField("outgoing");
  this.addField("content");
  this.addField("pageRank");
  this.setRef("_id");
});

/* 
  Query params:
    q: search query
    boost: true / false -- if true: elasticlunr score * pagerank score
    limit: number of results required -- min 1, max 50, default 10
*/

app.get("/", function (req, res, next) {
  res.status(200).render("index");
});

app.get("/personal", function (req, res, next) {
  let query = req.query.q;
  let numResults = 10;
  if (req.query.limit && 1 <= Number(req.query.limit) <= 50) {
    numResults = Number(req.query.limit);
  }
  let boost = req.query.boost === "true";

  if (!query) {
    res.status(200);
    res.format({
      html: function () {
        res.render("personal", { results: [], resultCount: 0 });
      },
      json: function () {
        res.send(JSON.stringify([]));
      },
    });
    return;
  }
  let result = personalIndex.search(query, {
    // fields: {
    //   title: { boost: 2 },
    //   content: { boost: 1 },
    // },
    bool: "AND",
  });
  let resultCount = result.length;

  if (boost) {
    for (let i = 0; i < resultCount; i++) {
      // console.log(result[i].score, "-->");
      result[i].score *= Number(
        personalIndex.documentStore.getDoc(result[i].ref).pageRank
      );
      // console.log(result[i].score);
    }
  }

  result.sort((a, b) => {
    return b.score - a.score;
  });

  result = result.slice(0, numResults);

  let resultObjArr = [];
  result.forEach((doc) => {
    let docResult = personalIndex.documentStore.getDoc(doc.ref);
    docResult.score = doc.score;
    let contentArr = docResult.content
      .replace(/(\r\n|\n|\r|\t|\n\t|\t\n)/gm, "")
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .split(" ");
    let contentMap = {};
    for (let word of contentArr) {
      if (word.length < 3) {
        continue;
      }
      if (contentMap[word]) {
        contentMap[word] += 1;
      } else {
        contentMap[word] = 1;
      }
    }
    docResult.contentMap = contentMap;
    resultObjArr.push(docResult);
  });

  res.status(200);
  res.format({
    html: function () {
      res.render("personal", {
        results: resultObjArr,
        resultCount: resultCount,
      });
    },
    json: function () {
      res.send(JSON.stringify(resultObjArr));
    },
  });
});

app.get("/fruits", function (req, res, next) {
  let query = req.query.q;
  let numResults = 10;
  if (req.query.limit && 1 <= Number(req.query.limit) <= 50) {
    numResults = Number(req.query.limit);
  }
  let boost = req.query.boost === "true";

  if (!query) {
    res.status(200);
    res.format({
      html: function () {
        res.render("fruits", { results: [], resultCount: 0 });
      },
      json: function () {
        res.send(JSON.stringify([]));
      },
    });
    return;
  }
  let result = fruitsIndex.search(query, {
    // fields: {
    //   title: { boost: 2 },
    //   content: { boost: 1 },
    // },
    bool: "AND",
  });
  let resultCount = result.length;

  if (boost) {
    for (let i = 0; i < resultCount; i++) {
      // console.log(
      //   fruitsIndex.documentStore.getDoc(result[i].ref).title,
      //   result[i].score,
      //   "*",
      //   fruitsIndex.documentStore.getDoc(result[i].ref).pageRank,
      //   "-->"
      // );
      result[i].score *= Number(
        fruitsIndex.documentStore.getDoc(result[i].ref).pageRank
      );
      // console.log(result[i].score);
    }
  }

  result.sort((a, b) => {
    return b.score - a.score;
  });

  result = result.slice(0, numResults);

  let resultObjArr = [];
  result.forEach((doc) => {
    let docResult = fruitsIndex.documentStore.getDoc(doc.ref);
    docResult.score = doc.score;
    let contentArr = docResult.content.split(/(\r\n|\n|\r)/gmy);
    let contentMap = {};
    for (let word of contentArr) {
      if (word.length < 3) {
        continue;
      }
      if (contentMap[word]) {
        contentMap[word] += 1;
      } else {
        contentMap[word] = 1;
      }
    }
    docResult.contentMap = contentMap;
    resultObjArr.push(docResult);
  });

  res.status(200);
  res.format({
    html: function () {
      res.render("fruits", { results: resultObjArr, resultCount: resultCount });
    },
    json: function () {
      res.send(JSON.stringify(resultObjArr));
    },
  });
});

app.get("/personal/:id", function (req, res, next) {
  let docResult = personalIndex.documentStore.getDoc(req.params.id);
  let contentArr = docResult.content
    .replace(/(\r\n|\n|\r|\t|\n\t|\t\n)/gm, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(" ");
  let contentMap = {};
  for (let word of contentArr) {
    if (word.length < 3) {
      continue;
    }
    if (contentMap[word]) {
      contentMap[word] += 1;
    } else {
      contentMap[word] = 1;
    }
  }
  docResult.contentMap = contentMap;
  res.status(200);
  res.format({
    html: function () {
      res.render("page", { result: docResult });
    },
    json: function () {
      res.send(JSON.stringify(docResult));
    },
  });
});

app.get("/fruits/:id", function (req, res, next) {
  let docResult = fruitsIndex.documentStore.getDoc(req.params.id);
  let contentArr = docResult.content.split(/(\r\n|\n|\r)/gmy);
  let contentMap = {};
  for (let word of contentArr) {
    if (word.length < 3) {
      continue;
    }
    if (contentMap[word]) {
      contentMap[word] += 1;
    } else {
      contentMap[word] = 1;
    }
  }
  docResult.contentMap = contentMap;
  res.status(200);
  res.format({
    html: function () {
      res.render("page", { result: docResult });
    },
    json: function () {
      res.send(JSON.stringify(docResult));
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

  db.collection("personalLinks")
    .find()
    .toArray(function (err, result) {
      if (err) {
        console.log("Error reading database.");
        return;
      }

      result.forEach((doc) => {
        personalIndex.addDoc(doc);
      });

      // fruits index -------
      db.collection("fruitLinks")
        .find()
        .toArray(function (err, result) {
          if (err) {
            console.log("Error reading database.");
            return;
          }

          result.forEach((doc) => {
            fruitsIndex.addDoc(doc);
          });

          // fruits index -------

          app.listen(3000);
          console.log("Server running at http://localhost:3000/");
        });
    });
});

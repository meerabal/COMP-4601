const express = require("express");
// const { ObjectId } = require("mongodb");
const mc = require("mongodb").MongoClient;
const Crawler = require("crawler");
// const baseUrl = "https://people.scs.carleton.ca/~davidmckenney/tinyfruits";
const baseUrl = "https://people.scs.carleton.ca/~davidmckenney/fruitgraph";

const app = express();

app.use(express.static("public"));
app.set("view engine", "pug");

let pageLinks = new Map();
let pageContent = new Map();
// let linkMap = new Map(); // for visited ( for visited ( if j links to i --> add) )
let visited = new Set(); // set because order doesn't matter
// let toVisit = []; // stack filo
// bfs if stack (filo)
// dfs if queue (fifo)

//Automatically parse JSON data
app.use(express.json());

const c = new Crawler({
  maxConnections: 10, //use this for parallel, rateLimit for individual
  rateLimit: 10,
  skipDuplicates: true,

  // This will be called for each crawled page
  callback: function (error, res, done) {
    if (error) {
      console.log(error);
    } else {
      let $ = res.$; //get cheerio data
      let links = $("a"); //get all links from page
      let content = $("p").text();
      let curParentLinkArr = res.request.path.split("/");
      let curParentLink =
        baseUrl + "/" + curParentLinkArr[curParentLinkArr.length - 1];
      // curParentLink = res.request.path;
      if (!visited.has(curParentLink)) {
        visited.add(curParentLink);
        let linkSet = new Set();
        // visit everything (bfs)
        $(links).each(function (i, link) {
          let curLink = $(link).attr("href");
          curLink = curLink.slice(1);
          curLink = baseUrl + curLink;
          linkSet.add(curLink);
          if (!visited.has(curLink)) {
            // add to db await
            c.queue(curLink);
          }
        });
        pageLinks.set(curParentLink, linkSet);
        pageContent.set(curParentLink, content);
      }
    }
    done();
  },
});

const linkBack = () => {
  for (const parentLink of visited) {
    for (const childLink of visited) {
      if (parentLink === childLink) {
        continue;
      }
      // // if childLink links to parentLink
      // if (parentLink === "/N-0.html" && childLink === "/N-3.html") {
      //   console.log("childlink", childLink);
      //   console.log("get parent's page links", pageLinks.get(parentLink));
      // }
      if (pageLinks.get(parentLink).has(childLink)) {
        // add to linkMap as childLink: parentLink
        // linkMap.set(childLink, parentLink);
        db.collection("links").updateOne(
          { link: childLink },
          {
            $addToSet: {
              children: parentLink,
            },
            $set: {
              content: pageContent.get(childLink),
            },
            // $inc: {
            //   childCount: 1,
            // },
          },
          { upsert: true },
          function (err, result) {
            if (err) throw err;
          }
        );
      }
    }
  }
};

app.get("/", function (req, res, next) {
  db.collection("links")
    .find()
    .toArray(function (err, result) {
      if (err) {
        res.status(500).send("Error reading database.");
        return;
      }
      res.status(200);
      res.format({
        html: function () {
          res.send(JSON.stringify(result));
        },
        json: function () {
          res.send(JSON.stringify(result));
        },
      });
    });
});

// top 10 with highest incoming links
app.get("/popular", function (req, res, next) {
  db.collection("links")
    .aggregate([
      // Project with an array length
      {
        $project: {
          link: 1,
          childCount: { $size: "$children" },
          children: 1,
        },
      },
      // Sort on the "length"
      { $sort: { childCount: -1 } },
      { $limit: 10 },
    ])
    // .find({}, { link: 1, childCount: 1 })
    // .sort({ childCount: -1 })
    // .limit(10)
    .toArray(function (err, result) {
      if (err) {
        res.status(500).send("Error reading database.");
        return;
      }
      res.status(200);
      res.format({
        html: function () {
          res.send(JSON.stringify(result));
        },
        json: function () {
          res.send(JSON.stringify(result));
        },
      });
    });
});
// url, list of pages linking to x
app.get("/page/:id", function (req, res, next) {
  db.collection("links").findOne(
    { link: baseUrl + "/" + req.params.id },
    function (err, result) {
      if (err) {
        res.status(500).send("Error reading database.");
        return;
      }
      res.status(200);
      res.format({
        html: function () {
          res.send(JSON.stringify(result));
        },
        json: function () {
          res.send(JSON.stringify(result));
        },
      });
    }
  );
});

//Triggered when the queue becomes empty
c.on("drain", function () {
  console.log("Done.===============================");
  // console.log(pageLinks);
  linkBack();
  // console.log(linkMap);
});

// connecting our database.
mc.connect("mongodb://localhost:27017", function (err, client) {
  c.queue(baseUrl + "/N-0.html");

  if (err) {
    console.log("Error in connecting to database");
    console.log(err);
    return;
  }
  db = client.db("store");
  app.listen(3000);
  console.log("Server running at http://localhost:3000/");
});

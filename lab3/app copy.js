const express = require("express");
const { ObjectId } = require("mongodb");
const mc = require("mongodb").MongoClient;
const Crawler = require("crawler");
const baseUrl = "https://people.scs.carleton.ca/~davidmckenney/tinyfruits/";

const app = express();

app.use(express.static("public"));
app.set("view engine", "pug");

let linkMap = new Map(); // for visited ( for visited ( if j links to i --> add) )
let visited = new Set(); // set because order doesn't matter
let toVisit = []; // stack filo

//Automatically parse JSON data
app.use(express.json());

const c = new Crawler({
  maxConnections: 10, //use this for parallel, rateLimit for individual
  // rateLimit: 10000,

  // This will be called for each crawled page
  callback: function (error, res, done) {
    if (error) {
      console.log(error);
    } else {
      let $ = res.$; //get cheerio data, see cheerio docs for info
      // console.log($.root());
      let links = $("a"); //get all links from page
      $(links).each(function (i, link) {
        //Log out links
        //In real crawler, do processing, decide if they need to be added to queue
        // console.log($(link).text() + ":  " + $(link).attr("href"));
        // db.collection("links").findOne(
        //   { link: $(link).attr("href") },p
        //   (err, result) => {
        // console.log(result);
        // if (result === null) {

        // visit once, scrape the page once

        if (!linkMap.has($(link).attr("href"))) {
          // console.log($(link).text() + ":  " + $(link).attr("href"));
          linkMap.set($(link).attr("href"), 1);
          // c.queue(baseUrl + $(link).attr("href").slice(1));

          // console.log("added", $(link).attr("href"));
        } else {
          // add current page to its count
          linkMap.set(
            $(link).attr("href"),
            linkMap.get($(link).attr("href")) + 1
          );
        }
        // db.collection("links").insertOne({ link: $(link).attr("href") });
        //     }
        //   }
        // );
      });
      // console.log("---------");
    }
    done();
  },
});

app.get("/", function (req, res, next) {});

// top 10 with highest incoming links
app.get("/popular", function (req, res, next) {});
// url, list of pages linking to x
app.get("/page/:id", function (req, res, next) {});

//Triggered when the queue becomes empty
c.on("drain", function () {
  console.log("Done.");
  console.log(linkMap);
});

c.on("schedule", function (options) {
  // console.log(options.callback);
  // options.skipDuplicates = true;
  // options.callback(() => {
  //   db.collection("links").insertOne({ link: $(link).attr("href") });
  // });
});

// connecting our database.
// mc.connect("mongodb://localhost:27017", function (err, client) {
//   if (err) {
//     console.log("Error in connecting to database");
//     console.log(err);
//     return;
//   }

//   db = client.db("store");
//   app.listen(3000);
//   console.log("Server running at http://localhost:3000/");
c.queue("https://people.scs.carleton.ca/~davidmckenney/tinyfruits/N-0.html");
//   // c.queue("https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html");
// });

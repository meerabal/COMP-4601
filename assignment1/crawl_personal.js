const mc = require("mongodb").MongoClient;
const Crawler = require("crawler");

const baseUrl = "https://lotr.fandom.com/wiki";

let n = 0;
let pageLinks = new Map();
let pageContent = new Map();
let pageTitle = new Map();
let visited = new Set(); // set because order doesn't matter
// bfs if stack (filo)
// dfs if queue (fifo)

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
      let title = $("title").text();
      let links = $("#content a"); //get all links from page
      let content = $("#content p").text();
      let curParentLinkArr = res.request.path.split("/").slice(2);
      let curParentLink = baseUrl + "/" + curParentLinkArr.join("/");
      if (!visited.has(curParentLink)) {
        visited.add(curParentLink);
        let linkSet = new Set();
        // visit everything (bfs)
        $(links).each(function (i, link) {
          let curLink = $(link).attr("href");
          if (!curLink) {
            return;
          }
          // console.log(curLink);
          // curLink = curLink.slice(1);
          // curLink = baseUrl + curLink;

          if (
            curLink.startsWith("/wiki/") &&
            !curLink.startsWith("/wiki/File:")
          ) {
            curLink = "https://lotr.fandom.com" + curLink;

            linkSet.add(curLink);
            if (!visited.has(curLink) && n < 500) {
              // add to db await
              // console.log(curLink);
              c.queue(curLink);
              n++;
            }
          }
        });
        pageLinks.set(curParentLink, linkSet);
        // outgoingLinks.set(curParentLink, links);
        pageContent.set(curParentLink, content);
        pageTitle.set(curParentLink, title);
      }
    }
    done();
  },
});

const linkBack = () => {
  console.log(visited);
  for (const parentLink of visited) {
    for (const childLink of visited) {
      if (parentLink === childLink) {
        continue;
      }
      // console.log("parentLink", parentLink, "childLink", childLink);
      // if childLink links to parentLink
      if (pageLinks.get(parentLink).has(childLink)) {
        let outgoingLinks = Array.from(pageLinks.get(childLink));

        // add to linkMap as childLink: parentLink
        db.collection("personalLinks").updateOne(
          { link: childLink },
          {
            $addToSet: {
              incoming: parentLink,
            },
            $set: {
              outgoing: outgoingLinks,
              content: pageContent.get(childLink),
              title: pageTitle.get(childLink),
            },
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

//Triggered when the queue becomes empty
c.on("drain", function () {
  console.log("Done.===============================");
  linkBack();
});

// connecting our database.
mc.connect("mongodb://localhost:27017", function (err, client) {
  if (err) {
    console.log("Error in connecting to database");
    console.log(err);
    return;
  }
  db = client.db("store");
  c.queue(baseUrl + "/The_Lord_of_the_Rings");
});

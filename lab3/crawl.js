const Crawler = require("crawler");
const baseUrl = "https://people.scs.carleton.ca/~davidmckenney/tinyfruits";
// const baseUrl = "https://people.scs.carleton.ca/~davidmckenney/fruitgraph";
let i = 0;
const mc = require("mongodb").MongoClient;

let pageLinks = new Map();
let pageContent = new Map();
// let linkMap = new Map(); // for visited ( for visited ( if j links to i --> add) )
let visited = new Set(); // set because order doesn't matter
// let toVisit = []; // stack filo
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
        // if (!linkMap.get(childLink)) {
        //   linkMap.set(childLink, [new Set(), pageContent.get(childLink)]);
        // } else {
        //   linkMap.get(childLink)[0].add(parentLink);
        // }
        // console.log(linkMap.get(childLink).add(parentLink));
      }
    }
  }
};

//Triggered when the queue becomes empty
c.on("drain", function () {
  console.log("Done.===============================");
  // console.log(pageLinks);
  linkBack();
  // console.log(linkMap);
});

mc.connect("mongodb://localhost:27017/", function (err, client) {
  if (err) throw err;
  console.log("Connected to database.");

  //Select the database by name
  db = client.db("store");
});
c.queue(baseUrl + "/N-0.html");

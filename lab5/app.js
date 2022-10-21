const express = require("express");
const { ObjectId } = require("mongodb");
const elasticlunr = require("elasticlunr");
const mc = require("mongodb").MongoClient;
const { Matrix } = require("ml-matrix");

const app = express();

app.use(express.static("public"));
app.set("view engine", "pug");

//Automatically parse JSON data
app.use(express.json());

let linkArr = [];
let randomSurferProbability = undefined;

app.get("/", function (req, res, next) {
  // calculate page rank

  //Transition probability matrix
  //Note: just a 2D array containing rows
  let P = randomSurferProbability;
  //Initial PageRank vector
  let x0_list = new Array(P.columns).fill(0);
  x0_list[0] = 1;
  let x0 = new Matrix([x0_list]);
  while (true) {
    x1 = x0.mmul(P);
    console.log("x0", x0, "x1", x1);

    // difference in sqrt of dot products < 0.0001
    let dotProd = 0;
    for (let i = 0; i < x0.columns; i++) {
      dotProd += Math.pow(x1.get(0, i), 2) - Math.pow(x0.get(0, i), 2);
    }
    console.log(dotProd);
    let euclidianDist = Math.sqrt(dotProd);
    x0 = x1;
    if (euclidianDist < 0.0001) {
      break;
    }
  }

  console.log(linkArr, x0);
  let linkScoreArray = [];
  for (let i = 0; i < x0.columns; i++) {
    linkScoreArray.push({ link: linkArr[i], score: x0.get(0, i) });
  }

  linkScoreArray.sort((a, b) => {
    return b.score - a.score;
  });

  console.log(linkScoreArray);
  res.status(200);
  res.format({
    json: function () {
      res.send(JSON.stringify(linkScoreArray.slice(0, 25)));
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

      const N = result.length;
      const alpha = 0.1;
      let randomJump = Matrix.mul(Matrix.ones(N, N), alpha / N);
      // A = matrix
      // (1 - alpha) * A
      // randomJump = alpha * matrix with all values 1/N

      for (let i = 0; i < N; i++) {
        linkArr[i] = result[i].link;
      }

      // processing db data to matrix here ---
      let matrixList = [];
      for (let i = 0; i < N; i++) {
        const item = result[i];
        if (item.outgoing.length === 0) {
          let row = new Array(N).fill(1 / N);
          continue;
        }

        let row = new Array(N).fill(0);
        const numRowOnes = item.outgoing.length;

        for (const child of item.outgoing) {
          let childIndex = linkArr.indexOf(child);
          row[childIndex] = 1 / numRowOnes;
        }
        matrixList[i] = row;
      }

      // console.log("MATRIX -------\n", new Matrix(matrixList));

      const matrix = Matrix.mul(new Matrix(matrixList), 1 - alpha);
      randomSurferProbability = Matrix.add(matrix, randomJump);
      console.log(randomSurferProbability);

      app.listen(3000);
      console.log("Server running at http://localhost:3000/");
    });
});

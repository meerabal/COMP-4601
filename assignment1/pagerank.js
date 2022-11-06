const mc = require("mongodb").MongoClient;
const { Matrix } = require("ml-matrix");

// let tableName = "personalLinks";
let tableName = "fruitLinks";

mc.connect("mongodb://localhost:27017", function (err, client) {
  if (err) {
    console.log("Error in connecting to database");
    console.log(err);
    return;
  }
  db = client.db("store");
  db.collection(tableName)
    .find()
    .toArray(function (err, result) {
      if (err) {
        console.log("Error reading database.");
        return;
      }

      // =====================================================================================
      let linkArr = [];
      let randomSurferProbability = undefined;
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
          matrixList[i] = row;
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

      const matrix = Matrix.mul(new Matrix(matrixList), 1 - alpha);
      randomSurferProbability = Matrix.add(matrix, randomJump);
      // console.log(randomSurferProbability);
      let P = randomSurferProbability;
      //Initial PageRank vector
      let x0_list = new Array(P.columns).fill(0);
      x0_list[0] = 1;
      let x0 = new Matrix([x0_list]);
      while (true) {
        x1 = x0.mmul(P);
        // console.log("x0", x0, "x1", x1);

        // difference in sqrt of dot products < 0.0001
        let dotProd = 0;
        for (let i = 0; i < x0.columns; i++) {
          dotProd += Math.pow(x1.get(0, i), 2) - Math.pow(x0.get(0, i), 2);
        }
        let euclidianDist = Math.sqrt(dotProd);
        x0 = x1;
        if (euclidianDist < 0.0001) {
          break;
        }
      }

      let linkScoreArray = [];
      for (let i = 0; i < x0.columns; i++) {
        linkScoreArray.push({
          _id: result[i]._id,
          link: linkArr[i],
          pageRank: x0.get(0, i),
        });
      }

      // linkScoreArray.sort((a, b) => {
      //   return b.score - a.score;
      // });

      async function updateLinkScore(link) {
        // console.log("updating", link.link, link._id, link.pageRank);
        await db.collection(tableName).updateOne(
          { _id: link._id },
          {
            $set: {
              pageRank: link.pageRank,
            },
          }
        );
      }
      for (let link of linkScoreArray) {
        updateLinkScore(link);
      }
    });
});

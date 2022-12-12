// Leave one out and MAE
// user based, ignoring negative similarities

const start = Date.now();
// const filename = "./parsed-data-trimmed.txt";
const filename = "./assignment2-data.txt";
const neighbourhoodSize = 5;
const noRating = 0;
// const filename = "./test2.txt";
// const neighbourhoodSize = 2;
// const noRating = -1;

const fs = require("fs");

let n = 0;
let m = 0;
let u = [];
let p = [];
let r = {}; // could be Map
let u_sum = {};
let u_num = {};
let sim = {};

const readFileFromPath = (path) => {
  try {
    const data = fs.readFileSync(path, "utf8");
    return data.trim("\n");
  } catch (err) {
    console.error(err);
  }
};

const parseInput = (str) => {
  let lineArr = str.split("\n");

  // number of users n and number of items m
  let strArr = lineArr[0].split(" ");
  n = Number(strArr[0]);
  m = Number(strArr[1]);

  // user names
  u = lineArr[1].split(" ").slice(0, u.length - 1);

  // product names
  p = lineArr[2].split(" ").slice(0, p.length - 1);

  // going through each row (user ratings)
  for (let i = 0; i < n; i++) {
    let u_i_ratings = lineArr[i + 3].trim().split(" ");
    r[u[i]] = {};
    // userRatedProducts[u[i]] = new Set();
    // going through each column of each row (rating from user[i] for each product j)
    u_sum[u[i]] = 0;
    u_num[u[i]] = 0;

    for (let j = 0; j < m; j++) {
      // r[u[i]][p[j]] = Number(u_i_ratings[j]);

      // keep running sum for ratings of u[i]
      if (Number(u_i_ratings[j]) !== noRating) {
        r[u[i]][p[j]] = Number(u_i_ratings[j]);
        u_sum[u[i]] += Number(u_i_ratings[j]);
        u_num[u[i]] += 1;
      }
    }
  }
};

const simOf = (user1, a, pKeys) => {
  sim[user1] = {};
  // let pKeys = Object.keys(r[user1]);
  let ru1 = u_sum[user1] / u_num[user1];

  for (let index = 0; index < u.length; index++) {
    let user2 = u[index];
    if (user1 === user2) continue;
    let ru2 = u_sum[user2] / u_num[user2];
    let num = 0;
    let diff_sq_1 = 0;
    let diff_sq_2 = 0;

    for (let index1 = 0; index1 < pKeys.length; index1++) {
      let prod = pKeys[index1];

      if (
        r[user2][prod] === undefined ||
        r[user2][prod] === noRating ||
        prod === a
      ) {
        continue;
      }
      num += (r[user1][prod] - ru1) * (r[user2][prod] - ru2);
      diff_sq_1 += Math.pow(r[user1][prod] - ru1, 2);
      diff_sq_2 += Math.pow(r[user2][prod] - ru2, 2);
    }
    sim[user1][user2] = num / (Math.sqrt(diff_sq_1) * Math.sqrt(diff_sq_2));
  }
};

let noValidNeighbours = 0;

const pred = (user, prod) => {
  // console.log("\n\nPredicting for user:", user);
  // console.log("Predicting for item:", prod);
  let num = 0;
  let denom = 0;
  let avg1 = u_sum[user] / u_num[user];

  let count = 0;
  let neighbourList = [];
  let simKeys = Object.keys(sim[user]);
  // console.log("simKeys", simKeys);

  for (let n = 0; n < neighbourhoodSize; n++) {
    let maxI = null;
    let maxVal = 0;
    for (let index = 0; index < simKeys.length; index++) {
      let i = simKeys[index];
      if (
        r[i][prod] === undefined ||
        r[i][prod] === noRating ||
        sim[user][i] <= 0 ||
        isNaN(sim[user][i]) ||
        neighbourList.includes(i)
      ) {
        continue;
      }
      if (maxVal < sim[user][i]) {
        maxVal = sim[user][i];
        maxI = i;
      }
    }

    if (maxVal > 0 && maxI !== null) {
      count++;
      neighbourList.push(maxI);
    }
  }
  if (count === 0) {
    num = 0;
    denom = 1;
    noValidNeighbours += 1;
  } else {
    for (let index = 0; index < count; index++) {
      let i = neighbourList[index];
      let rui = r[i][prod];
      let avg_b = u_sum[i] / u_num[i];
      num += sim[user][i] * (rui - avg_b);
      denom += sim[user][i];
    }
  }
  // console.log("count", count);
  // console.log("denom", denom);

  let predScore = avg1 + num / denom;
  // console.log("prod", prod, "predScore", predScore, "\n");
  if (predScore < 1) {
    underPred += 1;
    predScore = 1;
  } else if (predScore > 5) {
    overPred += 1;
    predScore = 5;
  }
  return predScore;
};

let fileContent = readFileFromPath(filename);
// populate u, p, r
parseInput(fileContent);
// get sim matrix
// calculateSim();
// print out result with predictions
// printOut();

let totalPred = 0;

// leave one out logic
// go through each item in a user (that is rated)
// predict score on current item
// store that in a matrix
let underPred = 0;
let overPred = 0;
let rec = {};
const leaveOneOut = () => {
  let maeNum = 0;
  let maeDenom = 0;
  for (let index = 0; index < u.length; index++) {
    let user = u[index];
    rec[user] = {};
    let pKeys = Object.keys(r[user]);

    for (let index1 = 0; index1 < pKeys.length; index1++) {
      let prod = pKeys[index1];
      if (r[user][prod] === undefined || r[user][prod] === noRating) {
        continue;
      }
      // console.log("Crossing out user", user, "and product", prod);
      let tempHold = r[user][prod];
      u_sum[user] -= tempHold;
      u_num[user] -= 1;
      r[user][prod] = noRating;
      totalPred += 1;
      // let simStart = Date.now();
      simOf(user, prod, pKeys);
      // let simEnd = Date.now();
      // console.log(`sim execution time: ${simEnd - simStart} ms`);

      rec[user][prod] = pred(user, prod);
      // console.log(rec);
      r[user][prod] = tempHold;
      u_sum[user] += tempHold;
      u_num[user] += 1;
      maeNum += Math.abs(rec[user][prod] - r[user][prod]);
      maeDenom += 1;
    }
  }
  console.log("maeNum", maeNum);
  console.log("maeDenom", maeDenom);

  return maeNum / maeDenom;
};

// mae
// loop through all users
//  loop though all predicted ratings for user
//  sum abs ( difference between pred and original )
//  sum num elements in predicted ratings

console.log(leaveOneOut());
console.log(totalPred);
console.log(noValidNeighbours);

const end = Date.now();
console.log(`Started at ${start.toLocaleString()}`);
console.log(`Execution time: ${end - start} ms`);
console.log(`Ended at ${end.toLocaleString()}`);

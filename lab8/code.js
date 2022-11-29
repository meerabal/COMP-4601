// Lab 8 - Leave one out and MAE
// item based, ignoring negative similarities

const start = Date.now();
const filename = "./parsed-data-trimmed.txt";
// const filename = "./test2.txt";

const fs = require("fs");

// TODO: change this to 5
const neighbourhoodSize = 5;
// TODO: switch these for final dataset
const noRating = 0;
const leftOutRating = 0;
let n = 0;
let m = 0;
let u = [];
let p = [];
let r = {}; // could be Map
let u_sum = {};
let u_num = {};
let sim = {};
let usersWhoRatedItem = {};
let usefulSims = {};

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
    // going through each column of each row (rating from user[i] for each product j)
    u_sum[u[i]] = 0;
    u_num[u[i]] = 0;

    for (let j = 0; j < m; j++) {
      r[u[i]][p[j]] = Number(u_i_ratings[j]);
      // keep running sum for ratings of u[i]
      if (Number(u_i_ratings[j]) !== noRating) {
        u_sum[u[i]] += Number(u_i_ratings[j]);
        u_num[u[i]] += 1;
        // if (usersWhoRatedItem[p[j]] === undefined) {
        //   usersWhoRatedItem[p[j]] = new Set();
        // }
        // usersWhoRatedItem[p[j]].add(u[i]);
      }
    }
  }
};

// a = product 1
// b = product 2
const simBet = (a, b) => {
  // TODO: think about refilling values
  if (sim[a] && sim[a][b]) {
    return sim[a][b];
  } else if (sim[a] === undefined) {
    sim[a] = {};
  }
  let num = 0;
  let diff_sq_1 = 0;
  let diff_sq_2 = 0;

  // if (!usersWhoRatedItem[a]) {
  //   usersWhoRatedItem[a] = new Set();
  //   usefulSims[a] = new Set();
  //   // return;
  // }
  for (let index = 0; index < u.length; index++) {
    let user = u[index];
    // TODO: need to subtract current val (?)
    let ru = u_sum[user] / u_num[user];
    if (r[user][a] === noRating || r[user][b] === noRating) {
      continue;
    }
    num += (r[user][a] - ru) * (r[user][b] - ru);
    diff_sq_1 += Math.pow(r[user][a] - ru, 2);
    diff_sq_2 += Math.pow(r[user][b] - ru, 2);
  }
  sim[a][b] = num / (Math.sqrt(diff_sq_1) * Math.sqrt(diff_sq_2));
  // TODO:
  // if (usefulSims[a] === undefined) {
  //   usefulSims[a] = new Set();
  // }
  // if (sim[a][b] > 0) {
  //   usefulSims[a].add(b);
  // }
  // return sim[a][b];
};

const simOf = (user, a) => {
  sim[a] = {};
  for (let index = 0; index < p.length; index++) {
    let prod = p[index];
    if (a === prod || r[user][prod] === noRating) {
      continue;
    }
    simBet(a, prod);
  }
};

let noValidNeighbours = 0;

const pred = (user, prod) => {
  // console.log("\n\nPredicting for user:", user);
  // console.log("Predicting for item:", prod);
  let num = 0;
  let denom = 0;

  let count = 0;
  let neighbourList = [];
  simOf(user, prod);
  for (let n = 0; n < neighbourhoodSize; n++) {
    let maxI = null;
    let maxVal = 0;
    // let lastVal = 0;
    // if(neighbourList !== []) {
    //   lastVal = neighbourList[count-1];
    // }
    for (let i in sim[prod]) {
      // console.log(i, sim[prod][i]);
      if (
        r[user][i] === noRating ||
        sim[prod][i] <= 0 ||
        isNaN(sim[prod][i]) ||
        neighbourList.includes(i)
      ) {
        continue;
      }
      if (maxVal <= sim[prod][i]) {
        maxVal = sim[prod][i];
        maxI = i;
      }
    }

    if (maxVal > 0 && maxI !== null) {
      count++;
      neighbourList.push(maxI);
    }
    // console.log(maxVal, maxI, neighbourList);
  }
  // if (count < neighbourhoodSize) {
  // console.log("only", count, "/", neighbourhoodSize, "neighbours");
  // }

  // console.log("Found", count, "valid neighbours:");
  // console.log(neighbourList);

  // DONE: what if count is 0?
  if (count === 0) {
    num = u_sum[user];
    denom = u_num[user];
    noValidNeighbours += 1;
  } else {
    for (let index = 0; index < count; index++) {
      let i = neighbourList[index];
      // simBet(i, prod);
      // console.log("- Item", i, "sim=", sim[prod][i]);
      let rui = r[user][i];
      num += sim[prod][i] * rui;
      denom += sim[prod][i];
    }
  }
  // console.log("count", count);
  // console.log("denom", denom);

  let predScore = num / denom;
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
    for (let index1 = 0; index1 < p.length; index1++) {
      let prod = p[index1];
      if (r[user][prod] === noRating) {
        continue;
      }
      // console.log("Crossing out user", user, "and product", prod);
      let tempHold = r[user][prod];
      r[user][prod] = noRating;
      totalPred += 1;
      // let newSim = recalculateSim(user, prod);
      // calculateSim();
      // console.log("sim =================");
      // console.log(sim);
      // console.log("newSim ==============");
      // console.log(newSim);
      rec[user][prod] = pred(user, prod);
      // console.log("Initial predicted value: ", tempHold);
      // console.log("Final predicted value:", rec[user][prod]);
      r[user][prod] = tempHold;
      // calculateSim();
      // console.log("user", user, "prod", prod);
      // console.log(
      //   rec[user][prod],
      //   r[user][prod],
      //   rec[user][prod] - r[user][prod]
      // );
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
// console.log(underPred);
// console.log(overPred);

const end = Date.now();
console.log(`Started at ${start.toLocaleString()}`);
console.log(`Execution time: ${end - start} ms`);
console.log(`Ended at ${end.toLocaleString()}`);

// Lab 8 - Leave one out and MAE
// item based, ignoring negative similarities

const fs = require("fs");

// TODO: change this to 5
const neighbourhoodSize = 2;
// TODO: switch these for final dataset
const noRating = -1;
const leftOutRating = 0;
let n = 0;
let m = 0;
let u = [];
let p = [];
let r = {}; // could be Map
let u_sum = {};
let u_num = {};
let u_avgs = {};
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
  u = lineArr[1].split(" ");

  // product names
  p = lineArr[2].split(" ");

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
      }
    }
  }
};

// a = product 1
// b = product 2
const simBet = (a, b) => {
  if (sim[a][b]) {
    return sim[a][b];
  }
  let num = 0;
  let diff_sq_1 = 0;
  let diff_sq_2 = 0;

  let numstr = "";

  for (let user of u) {
    let ru = u_sum[user] / u_num[user];
    if (r[user][a] === noRating || r[user][b] === noRating) {
      continue;
    }
    num += (r[user][a] - ru) * (r[user][b] - ru);
    numstr += r[user][a] - ru + "*" + (r[user][b] - ru) + "+";
    diff_sq_1 += Math.pow(r[user][a] - ru, 2);
    diff_sq_2 += Math.pow(r[user][b] - ru, 2);
  }
  sim[a][b] = num / (Math.sqrt(diff_sq_1) * Math.sqrt(diff_sq_2));

  // return sim[a][b];
};

const simOf = (a) => {
  sim[a] = {};
  for (let prod of p) {
    if (a === prod) {
      continue;
    }
    simBet(a, prod);
  }
};

// const calculateSim = () => {
//   for (let a of p) {
//     sim[a] = {};
//     for (let b of p) {
//       if (a === b) {
//         continue;
//       }
//       let num = 0;
//       let diff_sq_1 = 0;
//       let diff_sq_2 = 0;
//       for (let user of u) {
//         let ru = u_sum[user] / u_num[user];
//         if (r[user][a] === noRating || r[user][b] === noRating) {
//           continue;
//         }
//         num += (r[user][a] - ru) * (r[user][b] - ru);
//         diff_sq_1 += Math.pow(r[user][a] - ru, 2);
//         diff_sq_2 += Math.pow(r[user][b] - ru, 2);
//       }
//       sim[a][b] = num / (Math.sqrt(diff_sq_1) * Math.sqrt(diff_sq_2));
//     }
//   }
// };

let noValidNeighbours = 0;

const pred = (user, prod) => {
  let num = 0;
  let denom = 0;

  let count = 0;
  let neighbourList = [];

  simOf(prod);

  for (let n = 0; n < neighbourhoodSize; n++) {
    let maxI = null;
    let maxVal = 0;
    for (let i in sim[prod]) {
      if (r[user][i] === noRating || sim[prod][i] <= 0) {
        continue;
      }
      if (maxVal < sim[prod][i] && !neighbourList.includes(i)) {
        maxVal = sim[prod][i];
        maxI = i;
      }
    }
    if (maxVal > 0 && maxI !== null) {
      count++;
      neighbourList.push(maxI);
    }
  }
  if (count < neighbourhoodSize) {
    console.log("only", count, "/", neighbourhoodSize, "neighbours");
  }
  // console.log(neighbourList);
  for (let i of neighbourList) {
    let rui = r[user][i];
    simOf(i, prod);
    num += sim[i][prod] * rui;
    denom += sim[i][prod];
  }
  // DONE: what if count is 0?
  if (count === 0) {
    num = u_sum[user];
    denom = u_num[user];
    noValidNeighbours += 1;
  }

  let predScore = num / denom;
  console.log("predScore", predScore, "\n");
  return predScore;
};

const printOut = () => {
  let outStr = "";
  outStr += n + " " + m + "\n";
  outStr += u.join(" ") + "\n" + p.join(" ") + "\n";
  for (let user of u) {
    for (let prod of p) {
      let rating = r[user][prod];
      if (rating === noRating) {
        outStr += pred(user, prod) + " ";
      } else {
        outStr += rating.toString() + " ";
      }
    }
    outStr += "\n";
  }
  console.log(outStr);
};

let fileContent = readFileFromPath("./test2.txt");
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

let rec = {};
const leaveOneOut = () => {
  for (let user of u) {
    rec[user] = {};
    for (let prod of p) {
      if (r[user][prod] !== noRating) {
        totalPred += 1;
        rec[user][prod] = pred(user, prod);
      }
    }
  }
};

// mae
// loop through all users
//  loop though all predicted ratings for user
//  sum abs ( difference between pred and original )
//  sum num elements in predicted ratings

const mae = () => {
  let num = 0;
  let denom = 0;
  for (let user of u) {
    for (let i in rec[user]) {
      // console.log(rec[user]);
      num += Math.abs(rec[user][i] - r[user][i]);
      denom += 1;
    }
  }
  let maeVal = num / denom;
  return maeVal;
};

leaveOneOut();
console.log(mae());
console.log(totalPred);
console.log(noValidNeighbours);

// Lab 6 - user based nearest neighbour recommendations

const fs = require("fs");

let n = 0;
let m = 0;
let u = [];
let p = [];
let r = {}; // could be Map
let u_sum = {};
let u_num = {};
let u_avgs = {};
let sim = {};
let neighbourhoodSize = 2;

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
      if (Number(u_i_ratings[j]) !== -1) {
        u_sum[u[i]] += Number(u_i_ratings[j]);
        u_num[u[i]] += 1;
      }
    }
  }
};

const calculateSim = () => {
  for (let u1 of u) {
    sim[u1] = {};
    // calculate avg -----
    let avg1 = u_sum[u1] / u_num[u1];
    u_avgs[u1] = avg1;
    for (let u2 of u) {
      if (u1 === u2) {
        continue;
      }
      let avg2 = u_sum[u2] / u_num[u2];

      let num = 0; // numerator
      let diff_sq_1 = 0;
      let diff_sq_2 = 0;
      for (let p_i of p) {
        if (r[u1][p_i] === -1 || r[u2][p_i] === -1) {
          continue;
        }
        num += (r[u1][p_i] - avg1) * (r[u2][p_i] - avg2);
        diff_sq_1 += Math.pow(r[u1][p_i] - avg1, 2);
        diff_sq_2 += Math.pow(r[u2][p_i] - avg2, 2);
      }
      sim[u1][u2] = num / (Math.sqrt(diff_sq_1) * Math.sqrt(diff_sq_2));
    }
  }
};

// const getAvg = (user) => {
//   let num = 0;
//   let denom = 0;
//   for (prod in r[user]) {
//     let rating = r[user][prod];
//     if (rating === -1) {
//       continue;
//     }
//     num += rating;
//     denom += 1;
//   }
//   return num / denom;
// };

// const sim1 = (u1, u2) => {
//   let avg1 = getAvg(u1);
//   let avg2 = getAvg(u2);

//   let num = 0; // numerator
//   let diff_sq_1 = 0;
//   let diff_sq_2 = 0;
//   for (let p_i of p) {
//     if (r[u1][p_i] === -1 || r[u2][p_i] === -1) {
//       continue;
//     }
//     num += (r[u1][p_i] - avg1) * (r[u2][p_i] - avg2);
//     diff_sq_1 += Math.pow(r[u1][p_i] - avg1, 2);
//     diff_sq_2 += Math.pow(r[u2][p_i] - avg2, 2);
//   }
//   return num / (Math.sqrt(diff_sq_1) * Math.sqrt(diff_sq_2));
//   // sim[u1][u2] = num / (Math.sqrt(diff_sq_1) * Math.sqrt(diff_sq_2));
//   // console.log("sim =", sim[u1][u2]);
// };

// const pred = (a, p) => {
//   let avg1 = u_sum[a] / u_num[a];
//   let num = 0;
//   let denom = 0;
//   // fill sim[a]
//   let keysSorted = Object.keys(sim[a]).sort((x, y) => {
//     return sim1(a, y) - sim1(a, x);
//   });
//   console.log("keysSorted", keysSorted);
//   let numStr = "";
//   let denomStr = "";
//   for (let u2 of keysSorted.slice(0, 2)) {
//     console.log(u2);
//     let avg2 = u_sum[u2] / u_num[u2];

//     num += (r[u2][p] - avg2) * sim1(a, u2);
//     numStr += sim1(a, u2) + "* (" + r[u2][p] + "-" + avg2 + ") +";
//     denom += sim1(a, u2);
//     denomStr += sim1(a, u2) + "+";
//   }
//   console.log("numStr", numStr);
//   console.log("denomStr", denomStr);
//   let pred = avg1 + num / denom;
//   console.log(pred);
//   return pred;
// };

const pred1 = (a, p) => {
  let avg1 = u_sum[a] / u_num[a];
  let num = 0;
  let denom = 0;
  let keysSorted = Object.keys(sim[a]).sort((x, y) => {
    return sim[a][y] - sim[a][x];
  });
  for (let u2 of keysSorted.slice(0, neighbourhoodSize)) {
    let avg2 = u_sum[u2] / u_num[u2];

    num += (r[u2][p] - avg2) * sim[a][u2];
    denom += sim[a][u2];
  }
  let pred = avg1 + num / denom;
  return pred;
};

let fileContent = readFileFromPath("./test3.txt");
// populate u, p, r
parseInput(fileContent);
calculateSim();

const printOut = () => {
  // let outMatrix = [];
  let outStr = "";
  outStr += n + " " + m + "\n";
  outStr += u.join(" ") + "\n" + p.join(" ") + "\n";
  for (let user of u) {
    // let uArr = [];
    for (let prod of p) {
      let rating = r[user][prod];
      if (rating === -1) {
        // uArr.push(pred1(user, prod));
        outStr += pred1(user, prod).toFixed(2) + "\t";
      } else {
        // uArr.push(rating);
        outStr += rating.toString() + "\t";
      }
    }
    // outMatrix.push(uArr);
    outStr += "\n";
  }
  // console.log(outMatrix);
  console.log(outStr);
};
printOut();

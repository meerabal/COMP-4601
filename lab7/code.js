// Lab 7 - item based nearest neighbour recommendations

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
  for (let a of p) {
    sim[a] = {};
    for (let b of p) {
      if (a === b) {
        continue;
      }
      let num = 0;
      let diff_sq_1 = 0;
      let diff_sq_2 = 0;
      for (let user of u) {
        let ru = u_sum[user] / u_num[user];
        if (r[user][a] === -1 || r[user][b] === -1) {
          continue;
        }
        num += (r[user][a] - ru) * (r[user][b] - ru);
        diff_sq_1 += Math.pow(r[user][a] - ru, 2);
        diff_sq_2 += Math.pow(r[user][b] - ru, 2);
      }
      sim[a][b] = num / (Math.sqrt(diff_sq_1) * Math.sqrt(diff_sq_2));
      // console.log("sim[a][b] = ", sim[a][b]);
    }
  }
};

const pred = (user, prod) => {
  let num = 0;
  let denom = 0;
  let keysSorted = Object.keys(sim[prod]).sort((x, y) => {
    return sim[prod][y] - sim[prod][x];
  });

  for (let i of keysSorted.slice(0, neighbourhoodSize)) {
    if (sim[prod][i] < 0) {
      continue;
    }
    let rui = r[user][i];

    num += sim[i][prod] * rui;
    denom += sim[i][prod];
  }
  let predScore = num / denom;
  return predScore;
};

const printOut = () => {
  let outStr = "";
  outStr += n + " " + m + "\n";
  outStr += u.join(" ") + "\n" + p.join(" ") + "\n";
  for (let user of u) {
    for (let prod of p) {
      let rating = r[user][prod];
      if (rating === -1) {
        outStr += pred(user, prod) + " ";
      } else {
        outStr += rating.toString() + " ";
      }
    }
    outStr += "\n";
  }
  console.log(outStr);
};

let fileContent = readFileFromPath("./testa.txt");
// populate u, p, r
parseInput(fileContent);
// get sim matrix
calculateSim();
// print out result with predictions
printOut();

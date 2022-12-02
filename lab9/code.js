const fs = require("fs");

const filename = "test.txt";
const pathLength = 3;
const noRating = 0;
let u = [];
let p = [];
let userLiked = {};

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
    userLiked[u[i]] = [];
    // going through each column of each row (rating from user[i] for each product j)
    for (let j = 0; j < m; j++) {
      if (Number(u_i_ratings[j]) !== noRating) {
        userLiked[u[i]].push(p[j]);
      }
    }
  }
};

let fileContent = readFileFromPath(filename);
// populate u, p, r
parseInput(fileContent);
console.log(userLiked);

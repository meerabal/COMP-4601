const fs = require("fs");

const filename = "test5.txt";
const pathLength = 3;
const noRating = 0;
let u = [];
let p = [];
let userLiked = {};
let itemLikers = {};

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
      if (!itemLikers[p[j]]) {
        itemLikers[p[j]] = [];
      }
      if (Number(u_i_ratings[j]) !== noRating) {
        userLiked[u[i]].push(p[j]);
        if (!(u[i] in itemLikers[p[j]])) {
          itemLikers[p[j]].push(u[i]);
        }
      }
    }
  }
};

let fileContent = readFileFromPath(filename);
// populate u, p, r
parseInput(fileContent);
// console.log(userLiked);
// console.log(itemLikers);

const startUser = "User1";
let itemsWithPathCount = {};
for (let i = 0; i < p.length; i++) {
  itemsWithPathCount[p[i]] = 0;
}

for (let i = 0; i < userLiked[startUser].length; i++) {
  let item = userLiked[startUser][i];
  // itemsWithPathCount[item]++;
  for (let j = 0; j < itemLikers[item].length; j++) {
    let liker = itemLikers[item][j];
    if (liker === startUser) continue;
    for (let k = 0; k < userLiked[liker].length; k++) {
      let likersLiked = userLiked[liker][k];
      // if (likersLiked in userLiked[startUser]) continue;
      itemsWithPathCount[likersLiked]++;
    }
  }
}

let keysFiltered = Object.keys(itemsWithPathCount).filter((x) => {
  // console.log(x, userLiked[startUser], userLiked[startUser].includes(x));
  return itemsWithPathCount[x] !== 0 && !userLiked[startUser].includes(x);
});

let keysSorted = keysFiltered.sort((x, y) => {
  return itemsWithPathCount[y] - itemsWithPathCount[x];
});
// console.log(itemsWithPathCount);
// console.log(keysFiltered);
// console.log(keysSorted);

for (let i = 0; i < keysSorted.length; i++) {
  console.log(keysSorted[i], "-->", itemsWithPathCount[keysSorted[i]]);
}

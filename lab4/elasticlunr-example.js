const elasticlunr = require("elasticlunr");

//Create your documents
//i.e., what is stored in your Mongo database after crawling
const doc1 = {
  title: "apple peach party",
  body: "apple apple peach peach apple peach apple",
  id: 0
}

const doc2 = {
  title: "apple party",
  body: "apple apple apples apples apple apple apples",
  id: 1
}

const doc3 = {
  title: "banana peach party",
  body: "banana peach banana banana banana peach peach peach peach peach peach",
  id: 2
}

//Create your index
//Specify fields you want to include in search
//Specify reference you want back (i.e., page ID)
const index = elasticlunr(function () {
  this.addField('title');
  this.addField('body');
  this.setRef('id');
});

//Add all documents to the index
index.addDoc(doc1);
index.addDoc(doc2);
index.addDoc(doc3);

//Run some queries
const queries = [
  "apple",
  "apple peach",
  "peach apple",
  "apples peaches", //demonstrates stemming being applied
  "peach",
  "banana"
]

queries.forEach(query =>{
  console.log(`Querying for ${query}:`);
  console.log(index.search(query, {}));
  //You can take these results, load any necessary information, etc.
  //You may perform additional operations as well (e.g., PageRank boosting)
})

/*
Elasticlunr supports much more customization:
  -boosting on specific fields
  -specifying boolean model (AND/OR)
  -customizing tokenization, stop words, etc.
More documentation: http://elasticlunr.com/docs/index.html
*/

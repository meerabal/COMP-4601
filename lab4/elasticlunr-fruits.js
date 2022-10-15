const { ObjectId } = require("mongodb");
const elasticlunr = require("elasticlunr");

//Create your index
//Specify fields you want to include in search
//Specify reference you want back (i.e., page ID)
const index = elasticlunr(function () {
  this.addField("link");
  this.addField("children");
  this.addField("content");
  this.setRef("_id");
});

//Add all documents to the index
index.addDoc(doc1);
index.addDoc(doc2);

//Run some queries
const queries = [
  "apple",
  "apple peach",
  "peach apple",
  "apples peaches", //demonstrates stemming being applied
  "peach",
  "banana",
  "5",
  "N-0.html",
];

queries.forEach((query) => {
  console.log(`Querying for ${query}:`);
  console.log(
    index.search(query, {
      fields: {
        link: { boost: 2 },
        content: { boost: 1 },
      },
    })
  );
  //You can take these results, load any necessary information, etc.
  //You may perform additional operations as well (e.g., PageRank boosting)
});

/*
Elasticlunr supports much more customization:
  -boosting on specific fields
  -specifying boolean model (AND/OR)
  -customizing tokenization, stop words, etc.
More documentation: http://elasticlunr.com/docs/index.html
*/

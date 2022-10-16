Meera Balsara
101152760

Lab #4

Instructions to run: 

1. Have mongo daemon running in the background
mongod --dbpath="<insert database path>"

2. Run the following commands: (elasticlunr-example.js is a script to populate pages and info in database)
  npm install
  node ./elasticlunr-example.js 
  node ./app.js

Using mongosh, we can see that there is a links table in store which contains all the page info (from lab 3):
  mongosh
  use store
  db.links.find()

3. Navigate to http://localhost:3000/

4. Enter a query in the search term to see the results.
Code supports HTML as well as JSON queries, so Postman can also be used.


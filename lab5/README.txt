Meera Balsara
101152760

Lab #5

Instructions to run: 

1. Have mongo daemon running in the background
mongod --dbpath="<insert database path>"

2. Run the following commands: 
  npm install
  node ./crawl.js
  node ./app.js

Using mongosh, we can see that there is a links table in store which contains all the page info (from lab 3):
  mongosh
  use store
  db.links.find()

3. Navigate to http://localhost:3000/
Code supports JSON queries, so Postman can be used.


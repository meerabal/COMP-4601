Meera Balsara
101152760

Lab #2

Instructions to run: 

1. Have mongo daemon running in the background
mongod --dbpath="<insert database path>"

2. Run the following commands: (insert_products.js is a script to populate products in database)
npm install
cd ./code
node ./insert_products.js 
node ./server.js

3. Navigate to http://localhost:3000/ (for lab 1 related implementation)

4. For lab 2 specific stuff, use Postman (you will need to download it since the code runs on localhost)

5. Check database updates using mongosh (need to download this separately from mongod)
mongosh
use store
db.products.find()
db.orders.find()

6. Delete tables/collections
db.products.drop()
db.orders.drop()



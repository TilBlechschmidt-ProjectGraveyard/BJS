cd programs/server
call npm install
cd ..
cd ..
set MONGO_URL=mongodb://localhost:27017/BJS
set ROOT_URL=http://localhost
set PORT=8080
node main.js
set /p DUMMY=Hit ENTER to exit...
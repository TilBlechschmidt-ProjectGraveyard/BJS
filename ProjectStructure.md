# Project structure
### File root
.  
├── README.md **— Main dev documentation entry point**  
├── AccessCodes.md **— Pregenerated access codes**  
├── FaviconSizes.md **— Icon sizes**  
├── fakeCSV **— Files for mock data generator**  
│   ├── main.js  
│   ├── mockData.csv  
│   └── package.json  
├── meteor **— The main project files**  
│   ├── client  
│   ├── generate_documentation.sh  
│   ├── imports  
│   ├── public  
│   ├── server  
│   └── \*.json    
└── setupProject.sh **— Automated project setup script (Linux only)**

### Meteor folder
meteor  
├── client **— Everything that goes to the user only**  
├── imports **— Main API and BJS data**   
├── public **— Static assets**  
├── server **— Server entry point**  
├── generate_documentation.sh  **— Script to generate the API documentation (Unix only)**  
├── config.json **— Project configuration**   
└── \*.json **— Various configuration files**  

#### Client
meteor/client  
├── body.html **— <body> tag content**  
├── head.html **— <head> tag content**  
├── router.js **— URL routing (Not found, logout and Co.)**  
├── components **— Web components/templates**  
│   ├── config  
│   ├── input  
│   ├── login  
│   ├── offline  
│   ├── output  
│   ├── helpers.js **— General purpose helper functions**  
│   ├── icons.html  
│   ├── popup.html  
│   └── preloader.html  
├── lib **— External libraries**  
├── popups **— Popup contents**  
│   ├── datenschutz.html  
│   └── impressum.html  
├── styles **— CSS files defining the styling**  
└── test **— Automated front-end tests**  
    └── log.test.js  
    
#### Imports
meteor/imports  
├── api **— General purpose objects and classes**  
│   ├── accountManagement  
│   ├── crypto  
│   ├── database  
│   ├── logic  
│   ├── log.js  
│   └── streamer.js  
└── data **— Static data and management classes for BJS specifications**  
.   ├── data.txt **— Description of the structure of this folder and its contents**  
.   ├── athletics  
.   ├── gymnastics  
.   ├── swimming  
.   ├── startClasses.json  
.   └── wordsDE.json  

#### Server
meteor/server  
├── helpers.js **— General purpose helper functions**  
├── main.js **— Server entrypoint**  
├── meteorCalls.js **— Meteor functions (server API)**  
└── test **— Automated unit tests (server only)**  
.   ├── athlete.test.js  
.   ├── athletics.test.js  
.   ├── crypto.test.js  
.   ├── genCode.test.js  
.   ├── log.test.js  
.   └── swimming.test.js  

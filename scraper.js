/*
  Console application for getting infirmation from shirts4mike.com
*/

const scrapeIt = require('scrape-it');
const fs = require('fs');
const json2csv = require('json2csv');

const dataPath = './data';
let shirtInfo = [];

//Checking if data file exists
//If not create new one
if(!fs.existsSync(dataPath)){
  fs.mkdirSync(dataPath);
}

console.log(fs.existsSync(dataPath));
// Error function
function displayError(err) {
    let time = new Date();
    let errorText = '';

    if (err === 404) {
        errorText = `[${time}] ${err}: Cannot connect to http://shirts4mike.com\n`;
        console.error(`There's been a/an ${err} error. Cannot connect to http://shirts4mike.com`)
    } else {
        errorText = `[${time}] ${err}: Sorry! Something went wrong!\n`;
        console.error(`There's been a/an ${err} error. Please try again later`);
    }
    fs.appendFile('scraper-error.log', `${errorText}`, (err) => {
        if (err) throw err;  // logging and appending the error to the log file
    });
}

// Promise interface
scrapeIt("http://shirts4mike.com/shirts.php", {
  tShirts: {
      listItem: '.products li'
      , data: {
          url: {
              selector: 'a',
              attr: 'href'
          }
        }
      }
}).then(({ data, response }) => {
    if(response.statusCode !== 200) {
      displayError(err);
    } else {
      console.log(response.statusCode);
      const tShirts =  data.tShirts.map(object => `http://shirts4mike.com/${object.url}`);
      tShirts.forEach(link => {
        scrapeIt(link, {
          shirt: {
                   selector: '.wrapper',
                   data: {
                       Title: {
                           selector: '.shirt-picture img',
                           attr: 'alt'
                       },
                       Price: '.shirt-details .price',
                       ImageURL: {
                           selector: '.shirt-picture img',
                           attr: 'src'
                       }
                   }
                 }

          },(err,{data}) => {
                data.shirt.URL = link;  // adding the url property for each tee-shirt
                data.shirt.Time = new Date();  // adding the time property for each tee-shirt
                shirtInfo.push(data.shirt);  // storing all 8 tee-shirts data in an array
                if (err) {
                    displayError(response.statusCode);  // Handles any error that occurs in the callback
                } else {
                    //Creating and concatenating the file name with the current date
                    const date = new Date();
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    const day = date.getDate();

                    const filePath = `${dataPath}/${year}-${month}-${day}.csv`;
                    //Creating the CSV file
                    const fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];
                    const csv = json2csv({ data: shirtInfo, fields: fields });
                    //Write csv to file and save
                    fs.writeFile(filePath, csv, function (err) {
                        if (err) {
                            displayError(err);  // Handles any error in saving the CSV file
                        } else {
                            console.log('file saved');
                        }
                    });
                }
            });
      });
    }
}).catch((err) => {
    displayError(err);  // Handles any error that occurred in the promise
});

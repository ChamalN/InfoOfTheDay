var AWS = require("aws-sdk");
var http = require("http");
var async = require("async");
var request = require("request");

/**
 * Object used to store data retrieved from APIs, and then used to
 * generate email message.
 */
var todaysInfo = {
    location: null,
    temperature: null,
    conditions: null,
    latestNews: null
}

/**
 * Generate email message and publish to AWS SNS
 */
var publishEmail = (context) => {
    var sns = new AWS.SNS();

    var emailSubject = 'Info of the Day: ' + new Date().toDateString();
    var newsArticles = '';
    for(var i=0; i<todaysInfo.latestNews.length; i++) {
        newsArticles += (i+1) + '. ' + todaysInfo.latestNews[i].title + ' (' +
          todaysInfo.latestNews[i].url + ')\n';
    }
    var emailMessage = 'Good Morning!\n\nToday\'s weather in ' +
      todaysInfo.location + ' is ' + todaysInfo.conditions +
      ' with a temperature of ' + todaysInfo.temperature + '.\n\n' +
      'Here are the top news articles for today:\n\n' + newsArticles;
    var snsTopic = process.env.SNSTOPIC;

    var email = {
        Message: emailMessage,
        Subject: emailSubject,
        TopicArn: snsTopic
    };
    console.log('Publishing to SNS');
    sns.publish(email, context.done);
};

/**
 * Call the given API endpoint and processed the returned data. Data is
 * populated into the todaysInfo object which will be used to generate
 * the email.
 */
var processApiRequest = (apiDetails, callback) => {
    request(apiDetails.url, (err, resp, body) => {
        console.log('Calling ' + apiDetails.name);
        if(err) {
            //In case of an error, invoke callback with details
            return callback(err);
        }
        console.log('API call ' + apiDetails.name + ' complete');
        var data = JSON.parse(body);

        //Populate todaysInfo object
        switch (apiDetails.name) {
          case 'weather':
              todaysInfo.location = data.name;
              todaysInfo.conditions = data.weather[0].main;
              todaysInfo.temperature = data.main.temp;
              break;
          case 'news':
              var newsArticles = [];
              for(var i=0; i<data.articles.length; i++) {
                var article = {
                    title: data.articles[i].title,
                    url: data.articles[i].url
                };
                newsArticles.push(article);
              }
              todaysInfo.latestNews = newsArticles;
              break;
          default:
              return callback('Unknown API called');
        }

        callback(null);
    });
};

/**
 * Creates the list of APIs to call, and passes them on asynchronously to
 * processing function. Once the APIs have been called, the publish function
 * is invoked as a callback.
 */
var callApis = (context, callback) => {
    var weatherApiUrl = 'http://api.openweathermap.org/data/2.5/weather?id=1248991&APPID=' + process.env.OPENWEATHERKEY;
    var weatherApi = {
        name: 'weather',
        url: weatherApiUrl
    };

    var newsApiUrl = 'https://newsapi.org/v2/top-headlines?sources=bbc-news,cnn&language=en&apiKey=' + process.env.NEWSKEY;
    var newsApi = {
        name: 'news',
        url: newsApiUrl
    };

    var apis = [weatherApi, newsApi];

    //Pass each API to be processed
    async.each(apis, (apiDetails, callback) => {
        processApiRequest(apiDetails, callback);
    }, (err) => {
        if(err) {
            console.log('Error occurred: ' + err);
        } else {
            console.log('All API calls complete');
            //Call publishing function
            callback(context)
        }
    });
};

/**
 * Used to invoke the function by AWS Lambda
 */
exports.handler = (event, context, callback) => {
    console.log('Processing started.');
    callApis(context, publishEmail);
    callback(null, 'Processing Complete.');
};

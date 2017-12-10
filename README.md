# InfoOfTheDay
A simple AWS Lambda function integrated with AWS SNS to send a scheduled email containing weather data and news.
The purpose of this is to simply test the integration with AWS CloudWatch events and AWS Simple Notification System (SNS), so the code is not optimized.

## Preresquisites
* An AWS account is required. Everything related to this app can be done with a free tier account.
* The Lambda function must have permission to access the following resources:
** Amazon CloudWatch Logs (in oder to write logs)
** Amazon SNS (in order to publish messages) 
* An SNS topic must be set up prior to running, and an email subscription must be established.
* The following environment variables are used, and must be set up in the Lamda console. 
** OPENWEATHERKEY - API key for the Open Waether Map API
** NEWSKEY - API key for the News API
** SNSTOPIC - ARN of the SNS topic 

## Functionality
This Lambda function is written to be triggered by a CloudWatch event. Testing was done using scheduled events. When run, it will fetch data from the following APIs:
* Open Weather Map API (http://openweathermap.org/api)
* News API (https://newsapi.org/)

The data from these two APIs are combined into a simple email message which is then published to an SNS topic.

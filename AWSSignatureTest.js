'use strict';
var AWSSignature = require('./AWSSignature');

var assertBool = function (boolValue) {
	let output = (boolValue) ? 'v' : 'x';
	console.log(output + ' ' + boolValue);
};
var options = { method: 'POST',
	path: 'https://aws.sdsd/?querysdfsdf',
	serviceName: 'cognito',
	headers:
	{ 'Content-Type': 'json',
		'Authorization': 'sdfsdfsdf',
		'X-Amz-Date': '12312312' },
	body: 'request body',
	region: 'us-west1',
	datetime: '20160115T150505Z'
	};

var signature = new AWSSignature(options);
var expectedCanonicalString = "POST\nhttps://aws.sdsd/\nquerysdfsdf\nx-amz-date:12312312\n\nx-amz-date\n7f07c8b7eadc73f2755c60efb1d9d7ac0f094dd7c1dba3069d3be0214be10fb6";

console.log('Testing generating canoncialString from options');
assertBool(signature._canonicalString() == expectedCanonicalString);

console.log("\n\nTest AWS Provided sample\n\n");

var options2 = {
	path: '/?Param2=value2&Param1=value1',
	method: 'get',
	serviceName: 'service',
	headers: {
	'X-Amz-Date': '20150830T123600Z',
	'host': 'example.amazonaws.com'
	},
	datetime: '20150830T123600Z',
	region: 'us-east-1',
	body: ''
};

var sign2 = new AWSSignature(options2);

console.log("canonicalString");
assertBool(sign2._canonicalString() == "GET\n/\nParam1=value1&Param2=value2\nhost:example.amazonaws.com\nx-amz-date:20150830T123600Z\n\nhost;x-amz-date\ne3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
console.log("String to sign");
assertBool(sign2._stringToSign() == "AWS4-HMAC-SHA256\n20150830T123600Z\n20150830/us-east-1/service/aws4_request\n816cd5b414d056048ba4f7c5386d6e0533120fb1fcfa93762cf0fc39e2cf19e0");
console.log("Signature");
assertBool(sign2._getSignature('wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY') == "b97d918cfa904a5beff61c982a1b6f458b799221646efd99d3219ec94cdf2500");

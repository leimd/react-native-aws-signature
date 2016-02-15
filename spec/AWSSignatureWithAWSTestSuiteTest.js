"use strict";
const awsSign = require('../lib/AWSSignature');
const fs = require('fs');
const TEST_DIR = './spec/aws4_testsuite/';
describe('AWS Test Suite Tests ',() => {
	loopDir(TEST_DIR);

	function loopDir(uri) {
		if (uri[uri.length - 1] != '/') uri += '/';
		let dirs = fs.readdirSync(uri);
		dirs.forEach((dir) => {
			if (dir[0] != '.') {
				var newUri = uri + dir;
				if (fs.lstatSync(newUri).isDirectory()){
					loopDir(newUri);
				} else {
					if (dir.substr(-4,4) == '.req'){
						//start test right here;	
						//newUri : the req file's path
						//dir: reqfile name
						//uri: folder path already having tailing /
						test(uri, dir.split('.')[0]);
					}
				}
			}
		});
	}


	function test(folderPath, fileName) {
		let reqFileContent = fs.readFileSync(folderPath + fileName + '.req').toString().split('\n'),
		method = reqFileContent[0].split(' ')[0],
		path = reqFileContent[0].split(' ')[1],
		credentials = {
			SecretKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
			AccessKeyId: 'AKIDEXAMPLE'
		};
		reqFileContent.shift();
		let body = [];
		let headers = new Object();
		reqFileContent.forEach((line) => {
			let splitedLine = line.split(':');
			if (splitedLine.length == 2) {
				if (headers[splitedLine[0]] === undefined) {
					headers[splitedLine[0]] = splitedLine[1];
				} else {
					headers[splitedLine[0]] += ',' + splitedLine[1];
				}
			} else if (line != '\n' && line != ''){
				body.push(line);	
			}
		});
		body = body.join('\n');
		var options = {
			method: method,
			path: path,
			headers: headers,
			service: 'service',
			region: 'us-east-1',
			body: body,
			credentials: credentials
		}

		var AWSSignature = new awsSign();
		AWSSignature.setParams(options);
		it('should produce the correct canonical string for ' + fileName, () => {
			var expectedString = fs.readFileSync(folderPath + fileName + '.creq').toString();
			expect(AWSSignature.getCanonicalString()).toEqual(expectedString);
		});	

		it('should produce the correct string to sign for ' + fileName, () => {
			var expectedString = fs.readFileSync(folderPath + fileName + '.sts').toString();
			expect(AWSSignature.getStringToSign()).toEqual(expectedString);
		});	

		it('should produce the correct Authorization Header for ' + fileName, () => {
			var expectedString = fs.readFileSync(folderPath + fileName + '.authz').toString();
			expect(AWSSignature.getAuthorizationHeader().Authorization).toEqual(expectedString);
		});
	}
});

"use strict";
describe ("AWSSignature", () => {
	var AWSSignature = require("../lib/AWSSignature");
	var _ = require("lodash");
	var moment = require("moment");
	var signature;
	beforeEach(() => {
		signature = new AWSSignature();
	});
	describe("_reconstructQueryString", () => {
		it("Should return string sorted by the params key",() => {
			var sorted = signature._reconstructQueryString('Param2=str2&Param1=str1');
			expect(sorted).toEqual('Param1=str1&Param2=str2');
		})
	});

	describe("sanityCheckRequiredForKeys", () => {
		var keys = ['key1', 'key2'],
			object = { 'key1': 'value1'};

		it("should not raise exception where all the requred keys are present", () => {
			var newObj = Object.assign({}, object, {'key2': 'value2'}),
			sanityCheck = function() {
				signature._sanityCheckRequiredKeysFor(newObj, keys);
			};
			expect(sanityCheck).not.toThrow();	
		});

		it("should raise exception where required keys are missing", () => {
			var sanityCheck = function() {
				signature._sanityCheckRequiredKeysFor(object, keys);
			};
			expect(sanityCheck).toThrow("Missing the following keys in options: key2");	
		});

		it("should raise exception when keys is not an array", () => {
			var sanityCheck = function() {
				signature._sanityCheckRequiredKeysFor(object, 'sdfs');
			};
			expect(sanityCheck).toThrow('second argument has to be an array');	
		});

		it("should raise exception when keys empty", () => {
			var sanityCheck = function() {
				signature._sanityCheckRequiredKeysFor(object, []);
			};
			expect(sanityCheck).toThrow('second argument cannot be empty');	
		});

		it("should raise exception when object is not an object", () => {
			var sanityCheck = function() {
				signature._sanityCheckRequiredKeysFor('sdfsdf', ['dsfds', 's']);
			};
			expect(sanityCheck).toThrow('first argument has to be a javascript object');	
		});

		it("should raise exception when object is empty", () => {
			var sanityCheck = function() {
				signature._sanityCheckRequiredKeysFor({}, ['dsfds', 's']);
			};
			expect(sanityCheck).toThrow('first argument cannot be an empty object');	
		});
	
	});

	describe("_formatDateTime", () => {
		describe("should return Amazon style ISO-8601 datetime string", () => {
			it("when given Amazon style ISO-8601 datetime string", () => {
				let datetimeString = "20111015T080000Z";
				expect(signature._formatDateTime(datetimeString)).toEqual(datetimeString);		
			});

			it("when given ISO-8601 datetime string", () => {
				let datetimeString = "2015-10-15T08:00:00Z",
					expectedString = "20151015T080000Z";
				expect(signature._formatDateTime(datetimeString)).toEqual(expectedString);		
			});

			it("when given javascript Date object", () => {
				let time = moment("2015-02-09T08:00:00Z"),
					expectedString = "20150209T080000Z";
				let formatedDateTime = time.toDate();
				expect(signature._formatDateTime(formatedDateTime)).toEqual(expectedString);		
			});
		});

		it("should raise exception when the string passed in is not recoginzable by momentjs", () => {
			let formatDateTime = function() {
				signature._formatDateTime('fake date');
			}
			expect(formatDateTime).toThrow('Unacceptable datetime string');		
		});
	
	});

	describe("When tested using Sample provided on AWS website", () => {
		let credentials = {
			SecretKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'
		};
		var options = {
			path: '/?Param2=value2&Param1=value1',
			method: 'get',
			service: 'service',
			headers: {
				'X-Amz-Date': '20150830T123600Z',
				'host': 'example.amazonaws.com'
			},
			region: 'us-east-1',
			body: '',
			credentials
		};

		var secretKey = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY';

		beforeEach(() => {
			signature.setParams(options);
		});

		it('should produce the correct Canonical string', () => {
			let canonicalString = signature._getCanonicalString(),
				expectedString = "GET\n/\nParam1=value1&Param2=value2\nhost:example.amazonaws.com\nx-amz-date:20150830T123600Z\n\nhost;x-amz-date\ne3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
			expect(canonicalString).toBe(expectedString);
		});

		it('should produce the correct string to sign', () => {
			let stringToSign = signature._getStringToSign(),
				expectedString = "AWS4-HMAC-SHA256\n20150830T123600Z\n20150830/us-east-1/service/aws4_request\n816cd5b414d056048ba4f7c5386d6e0533120fb1fcfa93762cf0fc39e2cf19e0" ;
			expect(stringToSign).toBe(expectedString);		
		});

		it('should produce the correct signature', () => {
			let signatureStr = signature.getSignature(secretKey);
			expect(signatureStr).toBe("b97d918cfa904a5beff61c982a1b6f458b799221646efd99d3219ec94cdf2500");
		});
	});
});

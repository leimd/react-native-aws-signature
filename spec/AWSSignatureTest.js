"use strict";
describe ("AWSSignature", () => {
	var AWSSignature = require("../lib/AWSSignature");

	describe("_reconstructQueryString", () => {
		it("Should return string sorted by the params key",() => {
			var signature = new AWSSignature();
			var sorted = signature._reconstructQueryString('Param2=str2&Param1=str1');
			expect(sorted).toEqual('Param1=str1&Param2=str2');
		})
	});

	describe("When tested using Sample provided on AWS website", () => {
		var options = {
			path: '/?Param2=value2&Param1=value1',
			method: 'get',
			service: 'service',
			headers: {
				'X-Amz-Date': '20150830T123600Z',
				'host': 'example.amazonaws.com'
			},
			region: 'us-east-1',
			body: ''
		};

		var signature,
			secretKey = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY';

		beforeEach(() => {
			signature = new AWSSignature();
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

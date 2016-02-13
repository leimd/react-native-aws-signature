'use strict';
var crypto = require('crypto');

const ALGORITHM = 'AWS4-HMAC-SHA256';
const UNSIGNABLE_HEADERS = ['authorization', 'content-type', 'content-length', 'user-agent', 'expiresHeader'];

class AWSSignature {

	constructor(options) {
		this.method = options.method.toUpperCase();
		this.pathName = options.path.split('?')[0];
		this.queryString = this._reconstructQueryString(options.path.split('?')[1]);
		this.serviceName = options.serviceName;
		this.headers = options.headers;
		this.body = options.body;
		this.region = options.region;
		this.datetime = options.datetime;
	}

	_reconstructQueryString(queryString) {
		let arr = queryString.split('&'); // split query to array
		let arr2 = arr.sort((a,b) => { // sort by key
			if (a.split('=')[0] > b.split('=')[0]) {
				return 1;
			} else {
				return -1;
			}
		});

		return arr2.join('&');
	}

	_stringToSign() {
		// datetime example 20150830T123600Z\n same as in x-amz-date header

		let parts = [];
		parts.push(ALGORITHM);
		parts.push(this.datetime);
		parts.push(this._credentialString());
		parts.push(this._hexEncodedHash(this._canonicalString()));

		return parts.join('\n');
	}

	_credentialString() {
		var parts = [];
		parts.push(this.datetime.substr(0, 8));
		parts.push(this.region);
		parts.push(this.serviceName);
		parts.push('aws4_request');
		return parts.join('/');
	}

	_canonicalString() {
		var parts = [], pathname = this.pathName;
		parts.push(this.method);
		parts.push(encodeURI(this.pathName));
		parts.push(encodeURI(this.queryString)); // query string
		parts.push(this._canonicalHeaders() + '\n');
		parts.push(this._signedHeaders());
		parts.push(this._hexEncodedBodyHash());
		return parts.join('\n');
	}

	_getSignature(secretKey) {
		let kDate = AWSSignature.hmac("AWS4" + secretKey, this.datetime.slice(0,8)),
			kRegion = AWSSignature.hmac(kDate, this.region),
			kService = AWSSignature.hmac(kRegion, this.serviceName),
			kCredentials = AWSSignature.hmac(kService, "aws4_request");

		return AWSSignature.hmac(kCredentials, this._stringToSign(),'hex');
	}

	_canonicalHeaders() {
		var headers = [];
		for (let key in this.headers) {
			headers.push([key, this.headers[key]]);
		}
		headers.sort(function (a, b) {
		  return a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1;
		});
		var parts = [];
		headers.forEach(function(item) {
			let key = item[0].toLowerCase();
			if (this._isSignableHeader(key)) {
				parts.push(key + ':' +
						this._canonicalHeaderValues(item[1].toString()));
			}
		}, this);
		return parts.join('\n');
	}

	_canonicalHeaderValues(values) {
		return values.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
	}

	_isSignableHeader(key) {
		if (key.toLowerCase().indexOf('x-amz-') === 0) return true;
		return UNSIGNABLE_HEADERS.indexOf(key) < 0;
	}

	_signedHeaders() {
		var keys = [];
		for (let key in this.headers) {
			key = key.toLowerCase();
			if (this._isSignableHeader(key)) keys.push(key);
		}
		return keys.sort().join(';');
	}

	_hexEncodedBodyHash() {
		if (this.serviceName === 's3') {
		  return 'UNSIGNED-PAYLOAD';
		} else if (this.headers['X-Amz-Content-Sha256']) {
		  return this.headers['X-Amz-Content-Sha256'];
		} else {
		  return this._hexEncodedHash(this.body || '');
		}	
	}

	_hexEncodedHash(string) {
		return crypto.createHash('sha256').update(string).digest('hex');
	}

	static hmac(key, string, digest, fn) {
		if (!digest) digest = 'binary';
		if (digest === 'buffer') { digest = undefined; }
		if (!fn) fn = 'sha256';
		if (typeof string === 'string') string = new Buffer(string);
		return crypto.createHmac(fn, key).update(string).digest(digest);
	}
}

module.exports = AWSSignature;

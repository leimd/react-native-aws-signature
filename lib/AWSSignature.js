'use strict';
var crypto = require('crypto');
var moment = require('moment');

const ALGORITHM = 'AWS4-HMAC-SHA256';
const UNSIGNABLE_HEADERS = ['authorization', 'content-type', 'content-length', 'user-agent', 'expiresHeader'];
const AMAZON_HEADERS = {
	date: 'X-Amz-Date',
	expires: 'X-AMZ-Expires',
	algo: 'X-Amz-Algorithm',
	credential: 'X-Amz-Credential',
	signed: 'X-Amz-SignedHeaders',
	signature: 'X-Amz-Signature',
	contentSha256: 'X-Amz-Content-Sha256'
};
const REQUIRED_OPTIONS_KEYS = [
	"method",
	"path",
	"service",
	"region",
	"headers",
	"body",
];
const REQUIRED_HEADERS = [
	'host'
];


class AWSSignature {

	constructor() {
	}

	getSignature(secretKey) {
		let kDate = AWSSignature.hmac("AWS4" + secretKey, this._getDate()),
			kRegion = AWSSignature.hmac(kDate, this.region),
			kService = AWSSignature.hmac(kRegion, this.service),
			kCredentials = AWSSignature.hmac(kService, "aws4_request");

		return AWSSignature.hmac(kCredentials, this._getStringToSign(),'hex');
	}

	setParams(options) {
		this._sanityCheckOptionsHeaders(options);
		this.method = options.method.toUpperCase();
		this.pathName = options.path.split('?')[0];
		this.queryString = this._reconstructQueryString(options.path.split('?')[1]);
		this.service = options.service;
		this.headers = options.headers;
		this.body = options.body;
		this.region = options.region;
	}

	_sanityCheckRequiredKeysFor(object, keys) {
		let missingKeys = [];
		if (typeof object != 'object') throw 'first argument has to be a javascript object';
		if (Object.keys(object).length == 0) throw 'first argument cannot be an empty object';
		if (!Array.isArray(keys)) throw 'second argument has to be an array';
		if (keys.length == 0) throw 'second argument cannot be empty';
		keys.forEach((key) => {
			if (object[key] === undefined) missingKeys.push(key);
		});

		if (missingKeys.length > 0) {
			throw `Missing the following keys in options: ${missingKeys.join(' ')}`
		};
	}

	_sanityCheckOptionsHeaders(options) {
		this._sanityCheckRequiredKeysFor(options, REQUIRED_OPTIONS_KEYS);
		this._sanityCheckRequiredKeysFor(options.headers, REQUIRED_HEADERS);
		if (options.headers[AMAZON_HEADERS.date] === undefined) {
			if(options.headers.date === undefined) {
				throw `need either ${AMAZON_HEADERS.date} or date header`
			} else {
				this.datetime = this._formatDateTime(options.headers.date);
			}
		} else {
			this.datetime = this._formatDateTime(options.headers[AMAZON_HEADERS.date]);
		}
	}

	_formatDateTime(datetimeString) {
		if (!moment(datetimeString).isValid()) throw "Unacceptable datetime string"; // is warning message shows , please comment out moment.js line 850
		return moment(datetimeString).toISOString().replace(/[:\-]|\.\d{3}/g, '');
	}	

	_getDate() {
		return this.datetime.slice(0,8);
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

	_getStringToSign() {
		// datetime example 20150830T123600Z\n same as in x-amz-date header

		let parts = [];
		parts.push(ALGORITHM);
		parts.push(this.datetime);
		parts.push(this._getCredentialString());
		parts.push(this._hexEncodedHash(this._getCanonicalString()));

		return parts.join('\n');
	}

	_getCredentialString() {
		var parts = [];
		parts.push(this._getDate());
		parts.push(this.region);
		parts.push(this.service);
		parts.push('aws4_request');
		return parts.join('/');
	}

	_getCanonicalString() {
		var parts = [], pathname = this.pathName;
		parts.push(this.method);
		parts.push(encodeURI(this.pathName));
		parts.push(encodeURI(this.queryString)); // query string
		parts.push(this._canonicalHeaders() + '\n');
		parts.push(this._signedHeaders());
		parts.push(this._hexEncodedBodyHash());
		return parts.join('\n');
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
		if (this.service === 's3') {
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

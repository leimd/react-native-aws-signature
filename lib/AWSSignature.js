'use strict';
var crypto = require('crypto-js');
var moment = require('moment');

const ALGORITHM = 'AWS4-HMAC-SHA256';
const UNSIGNABLE_HEADERS = ['authorization', 'content-length', 'user-agent', 'expiresHeader'];
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
	"credentials"
];
const REQUIRED_HEADERS = [
	'host'
];


class AWSSignature {

	constructor() {
	}

	setParams(options) {
		this.sanityCheckOptionsHeaders(options);
		this.method = options.method.toUpperCase();
		this.pathName = options.path.split('?')[0];
		this.queryString = this.reconstructQueryString(options.path.split('?')[1]);
		this.service = options.service;
		this.headers = options.headers;
		this.body = options.body;
		this.region = options.region;
		this.credentials = options.credentials;
	}

	getCanonicalString() {
		var parts = [], pathname = this.pathName;
		parts.push(this.method);
		parts.push(this.pathName);
		parts.push(this.queryString); // query string
		parts.push(this.getCanonicalHeaders() + '\n');
		parts.push(this.getSignedHeaders());
		parts.push(this.hexEncodedBodyHash());
		return parts.join('\n');
	}

	getStringToSign() {
		let parts = [];
		parts.push(ALGORITHM);
		parts.push(this.datetime);
		parts.push(this.getCredentialString());
		parts.push(this.getHexEncodedHash(this.getCanonicalString()));

		return parts.join('\n');
	}

	getSignature() {
		let kDate = AWSSignature.hmac("AWS4" + this.credentials.SecretKey, this.getDate()),
			kRegion = AWSSignature.hmac(kDate, this.region),
			kService = AWSSignature.hmac(kRegion, this.service),
			kCredentials = AWSSignature.hmac(kService, "aws4_request");

		return AWSSignature.hmac(kCredentials, this.getStringToSign(),'hex');
	}

	getAuthorizationHeader() {
		let header = `${ALGORITHM} Credential=${this.credentials.AccessKeyId}/${this.getCredentialString()}, SignedHeaders=${this.getSignedHeaders()}, Signature=${this.getSignature()}`;

		return {'Authorization': header};
	}

	sanityCheckRequiredKeysFor(object, keys) {
		let missingKeys = [];
		if (typeof object != 'object') throw 'first argument has to be a javascript object';
		if (Object.keys(object).length == 0) throw 'first argument cannot be an empty object';
		if (!Array.isArray(keys)) throw 'second argument has to be an array';
		if (keys.length == 0) throw 'second argument cannot be empty';

		let objKeys = Object.keys(object).map((key) => { return key.toLowerCase();});
		keys.forEach((key) => {
			if (objKeys.indexOf(key.toLowerCase()) == -1) missingKeys.push(key);
		});

		if (missingKeys.length > 0) {
			throw `Missing the following keys in options: ${missingKeys.join(' ')}`
		};
	}

	sanityCheckOptionsHeaders(options) {
		this.sanityCheckRequiredKeysFor(options, REQUIRED_OPTIONS_KEYS);
		this.sanityCheckRequiredKeysFor(options.credentials, ['SecretKey', 'AccessKeyId']);
		this.sanityCheckRequiredKeysFor(options.headers, REQUIRED_HEADERS);
		if (options.headers[AMAZON_HEADERS.date] === undefined) {
			if(options.headers.date === undefined) {
				throw `need either ${AMAZON_HEADERS.date} or date header`
			} else {
				this.datetime = this.formatDateTime(options.headers.date);
			}
		} else {
			this.datetime = this.formatDateTime(options.headers[AMAZON_HEADERS.date]);
		}
	}

	formatDateTime(datetimeString) {
		if (!moment(datetimeString).isValid()) throw "Unacceptable datetime string"; // is warning message shows , please comment out moment.js line 850
		return moment(datetimeString).toISOString().replace(/[:\-]|\.\d{3}/g, '');
	}	

	getDate() {
		return this.datetime.slice(0,8);
	}

	reconstructQueryString(queryString) {
		if (queryString === undefined) return '';
		let arr = queryString.split('&'); // split query to array
		let arr2 = arr.sort((a,b) => { // sort by key
			if (a.split('=')[0] > b.split('=')[0]) {
				return 1;
			} else if (a.split('=')[0] < b.split('=')[0]) {
				return -1;	
			} else if (a.split('=')[1] > b.split('=')[1]) {
				return 1;
			} else if (a.split('=')[1] < b.split('=')[1]) {
				return -1;
			} else {
				return 0;
			}
		});

		return arr2.map((query)=>{
			let name = query.split('=')[0],
				value = query.split('=')[1] || '';
			return this.uriEscape(name) + '=' + this.uriEscape(value);
		}).join('&');
	}


	getCredentialString() {
		var parts = [];
		parts.push(this.getDate());
		parts.push(this.region);
		parts.push(this.service);
		parts.push('aws4_request');
		return parts.join('/');
	}

	getCanonicalHeaders() {
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
			if (this.isSignableHeader(key)) {
				parts.push(key + ':' +
						this.getCanonicalHeaderValues(item[1].toString()));
			}
		}, this);
		return parts.join('\n');
	}

	getCanonicalHeaderValues(values) {
		return values.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
	}

	isSignableHeader(key) {
		if (key.toLowerCase().indexOf('x-amz-') === 0) return true;
		return UNSIGNABLE_HEADERS.indexOf(key) < 0;
	}

	getSignedHeaders() {
		var keys = [];
		for (let key in this.headers) {
			key = key.toLowerCase();
			if (this.isSignableHeader(key)) keys.push(key);
		}
		return keys.sort().join(';');
	}

	hexEncodedBodyHash() {
		if (this.service === 's3') {
		  return 'UNSIGNED-PAYLOAD';
		} else if (this.headers['X-Amz-Content-Sha256']) {
		  return this.headers['X-Amz-Content-Sha256'];
		} else {
		  return this.getHexEncodedHash(this.body || '');
		}	
	}

	getHexEncodedHash(string) {
		if (typeof string === 'string') string = new Buffer(string);
		return crypto.SHA256(string).toString(crypto.enc.HEX);
	}

	uriEscape(string) {
		var output = encodeURIComponent(string);
		output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape);

		// AWS percent-encodes some extra non-standard characters in a URI
		output = output.replace(/[*]/g, function(ch) {
			return '%' + ch.charCodeAt(0).toString(16).toUpperCase();
		});

		return output;
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

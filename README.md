# AWSSignature
### helps you generate signature for aws request for React-Native applications (or other js applications )
[![NPM](https://nodei.co/npm/react-native-aws-signature.png)](https://nodei.co/npm/react-native-aws-signature/)

library to generate AWS signaure V4 for React Native application because react-native's javascript runtime doesn't support running aws-sdk-js.
This is the first part if you want to make any signed calls to AWS.

## Installation
`npm install react-native-aws-signature --save`


## Usage
``` javascript
var AWSSignature = require('react-native-aws-signature');
var awsSignature = new AWSSignature();
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
awsSignature.setParams(options);
var signature = awsSignature.getSignature();
```

##Workflow
1.Instantiate AWSSignature object by calling `var awsSignature = new AWSSignature();`

2.Set signature parameter by calling 'AWSSignature#setParams' with option object as the only parameter.

	the option given in the example comprises of the minimal requirement needed to generate AWS signature

|option| |
|---|---|
|path|the path you're calling|
|method| HTTP method |
|service| AWS Service you're using ex. s3|
|headers| HTTP headers|
|region| AWS regions|
|body| HTTP request body|
|credentials| credentails object returned by coginto##GetCredentialsForIdentity, more on this later|

for headers, `host` and (`date` or `X-Amz-Date`) is required, other wise an exception will raise.

## Credentials
The minials requried credentail object looks like this:
```
{
	SecretKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'
};
```

The only required key is SecretKey that you get from coginto##GetCredentialsForIdentity or somewhere else.

## running test
once you cloned the git repo, do `npn install` first to install all the dependencies,

tests are written in jasmine, so just use `jasmine` to run the unit tests.

"use strict";
describe("Util", () => {
    const Util = require('../lib/Util'),
    moment = require('moment');

	describe("formatDateTime", () => {
		describe("should return Amazon style ISO-8601 datetime string", () => {
			it("when given Amazon style ISO-8601 datetime string", () => {
				let datetimeString = "20111015T080000Z";
				expect(Util.formatDateTime(datetimeString)).toEqual(datetimeString);		
			});

			it("when given ISO-8601 datetime string", () => {
				let datetimeString = "2015-10-15T08:00:00Z",
					expectedString = "20151015T080000Z";
				expect(Util.formatDateTime(datetimeString)).toEqual(expectedString);		
			});

			it("when given javascript Date object", () => {
				let time = moment("2015-02-09T08:00:00Z"),
					expectedString = "20150209T080000Z";
				let formatedDateTime = time.toDate();
				expect(Util.formatDateTime(formatedDateTime)).toEqual(expectedString);		
			});
		});

		it("should raise exception when the string passed in is not recoginzable by momentjs", () => {
			let formatDateTime = function() {
				Util.formatDateTime('fake date');
			}
			expect(formatDateTime).toThrow('Unacceptable datetime string');		
		});
	
	});


});

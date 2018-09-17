"use strict";

class Moodle extends Extractor {

    constructor() {
        super();
        this.ready();
    }

    attachIfPossible() {
    
        // sidebar mini calendars
        $('[data-template="core_calendar/month_mini"] > .calendarwrapper').each((index, calendarWrapper) => {
            // get month and year
            let month = calendarWrapper.getAttribute('data-month'), 
                year = calendarWrapper.getAttribute('data-year');
            
            if(month === undefined || year === undefined) {
                // TODO
                // throw
			}
			
            this._getMonthEvents(month, year).then(events => {
				let $saveBtn = $(`<a class="calendarBtn" title="Save exams to your Calendar"><img src="${chrome.extension.getURL("icons/calendar.svg")}"/></a>`);

                if(events.length > 0) {
                    $saveBtn.click(() => {
                        handleEvents(this, events, undefined, undefined, true);
                    });
        
                    $(calendarWrapper).parent().append($saveBtn);
                }
            });
            
        });
    }

    structure() {
        return {
            extractor: "moodle",
            description: "Extracts moodle calendar events",
            parameters: [{
                    name: "name",
                    description: "eg: Minitest Compilers"
                },
                {
                    name: "type",
                    description: "eg: Submission"
                }, {
                    name: "url",
                    description: "link to the event page in moodle"
                }
            ],
            storage: {
                text: [{
                    name: "title",
                    default: "${name}"
                }],
                textarea: [{
                    name: "description",
                    default: "Type:${type}\nLink: <a href=\"${url}\">${name}</a>"
                }],
                boolean: [{
                    name: "isHTML",
                    default: true
                }]
            }
        }
    }

    convertToURI(event) {
        event.url = encodeURIComponent(event.url);
        return event;
    }

    /**
     *
     * @param {*} event
     * @param {*} forUrl
     * @param {*} noHTML If true, returns the description in plain text. Otherwise, returns the description HTML formatted
     */
    getNewDiv(div, event) {
        var google_url = eventToGCalendar(this, event);
        var outlook_url = eventToOutlookCalendar(this, event);

        // Browsers ignore newlines on the URLs, they are ommited. Therefore, I encode all newlines if formats are plain text
        return `
        ${div.find("img")[0].outerHTML}
        ${generateOneClickDOM("sig_moodleCalendar", "calendarIconMoodle smallicon", "google", google_url, Moodle.isHTML).outerHTML}
        ${generateOneClickDOM("sig_moodleCalendar", "calendarIconMoodle smallicon", "outlook", outlook_url, Moodle.isHTML).outerHTML}
        ${div.find("a")[0].outerHTML}`;
    }

    static getEvent(eventTd) {
        let anchor = eventTd.find("a");
        let d = new Date(1000 * parseFloat(anchor[0].href.match(/time=(\d+)/)[1]));
        return {
            name: anchor.text(),
            type: jTry(() => {
                return eventTd.find("img").attr("title");
            }, ""),
            url: anchor[0].href,
            from: d,
            to: d,
            location: "Moodle"
        };
    }

    /**
     * @desc Returns the current session key
     * @return {String} session key
     */
    _getSessionID() {
        let url = document.evaluate('//*[@id="footer-left"]/div/div/a[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.attributes[0].value;
        return url.slice(url.indexOf('=') + 1);
    }

    _getEventData(eventID) {
        let reqUrl = `https://moodle.up.pt/lib/ajax/service.php?sesskey=${this._getSessionID()}&info=core_calendar_get_calendar_event_by_id`;
        
        let myBody = {
            index: 0, 
            methodname: 'core_calendar_get_calendar_event_by_id', 
            args: {
                eventid: eventID
            }
        };
        
        fetch(reqUrl, {
            method: 'POST',
            headers: {
                'Accept':'application/json, text/javascript, */*; q=0.01',
                'Content-Type':'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify([myBody]),
            mode: 'cors',
            credentials: 'include',
            referrerPolicy: 'no-referrer-when-downgrade'
        }).then(function(response) {
            response.json().then(json => {
                return json;
              });
        });
    }

    _getMonthEvents(month, year) {
        return new Promise(resolve => {
            let reqUrl = `https://moodle.up.pt/lib/ajax/service.php?sesskey=${this._getSessionID()}&info=core_calendar_get_calendar_monthly_view`; 
        
            fetch(reqUrl, {
                credentials:'include',
                headers:{},
                referrerPolicy:"no-referrer-when-downgrade",
                method:'POST',
                mode:'cors',
                body:JSON.stringify([{
                    index:0,
                    methodname: 'core_calendar_get_calendar_monthly_view', 
                    args: {
                        year:year,
                        month:month,
                        courseid:1,
                        categoryid:0,
                        includenavigation:false,
                        mini:true
                    }
                }]),
            }).then(response => {
                response.json().then( json => {
                    let responseJson = json[0]; // expected a single element size array
                    if(responseJson.error) {
                        // something went wrong
                    }
    
                    let events = [];
                    responseJson.data.weeks.forEach(week => {
                        week.days.forEach(day => {
                            if(day.hasevents) {
                                day.events.forEach(eventJSON => {
									// check if the same event already doesn't exist due recurrency
									let found = false;
									for(let ev of events) {
										if(ev.repeatid === eventJSON.repeatid) {
											found = true;
											break;
										}
									};
									// if new event, then add to array
									if(!found)
										events.push(this._parseEvent(eventJSON));
                                });
                            }
                        });
                    });
    
                    // return promise
                    resolve(events);
                });
            });  
        });
    }

    /**
     * Returns the recurrence for a given event
     * 
     * @param {Date} from 
     * @param {Number} id 
     * @param {Number} repeatid 
     * @param {Number} recurrenceCount
	 * 
	 * @return {Object} The object has two properties: from, to. Both can be {Date} instances or null when the event doesn't have recurrence
     */
    _getEventRecurrence(from, id, repeatid, recurrenceCount) {
        if(repeatid === null || recurrenceCount === null) {
            return {
                from: null,
                to: null
            }
        }

        // how many miliseconds a week has (24*3600*7 = 604800 seconds)
        const weekMiliseconds = 604800e3;

        // is this the parent event, the origin?
        if(repeatid === id) {
            // we only need to compute when the recurrence ends
            // we know how many times the event ocurrs
            // one week 604800 seconds
            // remember that Date().setTime and .getTime() work in miliseconds
            return {
                from: from,
                to: new Date(from.getTime() + weekMiliseconds * (recurrenceCount - 1))
            }
        } else {
            // it's not the parent, we must compute both from and end
            // Recurrent events have sequential id's (5013, 5014, ...)
            // The diff between id and repeatid tells us the weeks difference
            // thus we can compute the first event ocurrence based on weeks difference and this ocurrence timestamp
            let f = new Date(from.getTime() - (id - repeatid)*weekMiliseconds);
			let t = new Date(f.getTime() + weekMiliseconds * (recurrenceCount - 1));
			
            return {
                from: f,
                to: t
            }
        }
	}
	
	/**
	 * Parses an event provenient from a server request
	 * 
	 * @param {Object} eventJSON The JSON object to be parsed
	 * 
	 * @return {Object} An object to represent the event and be used on the application
	 */
	_parseEvent(eventJSON) {
		let recur = this._getEventRecurrence(new Date(eventJSON.timestart * 1e3), eventJSON.id, eventJSON.repeatid, eventJSON.eventcount);

		let parsedEvent = {
			download: true,
			location: undefined,
			// extra information
			name: eventJSON.name,
			description: eventJSON.description,
			type: eventJSON.eventtype,
			url: eventJSON.viewurl,
			// recurrence for this event
			recurrence: recur,
			// for dealing with recurrent events
			id: eventJSON.id, // number
			repeatid: eventJSON.repeatid, // null or an id
			recurrenceCount: eventJSON.eventcount // null or a number
		};

		/**
		 * If the event hasn't recurrence (repeatid == null), the event's from (timestart) and to (timestart + duration) is directly available
		 * If the event has recurrence, must calculate both from (the parent event start time) and to.
		 */
		if(eventJSON.repeatid === null) {
			parsedEvent.from = new Date(eventJSON.timestart * 1e3);
			parsedEvent.to = new Date((eventJSON.timestart + eventJSON.timeduration) * 1e3);
		} else {
			parsedEvent.from = parsedEvent.recurrence.from;
			parsedEvent.to = new Date(parsedEvent.from.getTime() + eventJSON.timeduration * 1e3);
		}

		return parsedEvent;
	}
}

// add an instance to the EXTRACTORS variable, and also trigger attachIfPossible due to constructor
EXTRACTORS.push(new Moodle());
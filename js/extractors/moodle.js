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
                        handleEvents(this, events);
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
            "index": 0, 
            "methodname": 
            "core_calendar_get_calendar_event_by_id", 
            "args": {
                "eventid": eventID
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
                                day.events.forEach(event => {
                                    events.push({
                                        from: new Date(event.timestart*1000),
                                        to: new Date((event.timestart + event.timeduration)*1000),
                                        download: false,
                                        location: undefined,
                                        // extra information
                                        name: event.name,
                                        description: event.description,
                                        type: event.eventtype,
                                        url: event.viewurl
                                    });
                                });
                            }
                        });
                    });
    
                    // return promise
                    resolve(events);
                });
            });  
        })
        
    }
}

// add an instance to the EXTRACTORS variable, and also trigger attachIfPossible due to constructor
EXTRACTORS.push(new Moodle());
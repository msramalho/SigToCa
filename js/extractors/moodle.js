"use strict";
class MoodleEvent {
    constructor() {
        $(".hasevent").each((index, td) => {
            let popupContent = $(`<div>${$(td).attr("data-core_calendar-popupcontent")}</div>`);
            let newPopupContent = "";
            popupContent.find("div").each((index, div) => {
                div = $(div);
                newPopupContent += MoodleEvent.getNewDiv(div, MoodleEvent.getEvent(div));
            });
            $(td).attr("data-core_calendar-popupcontent", newPopupContent);
        });
    }

    static convertToURI(original) {
        let event = jQuery.extend(true, {}, original);
        event.url = encodeURIComponent(event.url);
        return event;
    }

    /**
     * 
     * @param {*} event 
     * @param {*} forUrl 
     * @param {*} noHTML If true, returns the description in plain text. Otherwise, returns the description HTML formatted 
     */

    static getNewDiv(div, event) {
        console.log(encodeURI(eventToGCalendar(MoodleEvent, event)));
        return `
        ${div.find("img")[0].outerHTML}
        <a class="sig_moodleCalendar" href="#" onclick="window.open(decodeURI('${encodeURI(eventToGCalendar(MoodleEvent, event)).replace(/\s/g, "%20")}'));" title="Add this single event to your Google Calendar in One click!"><img class="calendarIconMoodle smallicon" alt="google calendar icon" src="${chrome.extension.getURL("icons/gcalendar.png")}"/></a>
        <a class="sig_moodleCalendar" href="#" onclick="window.open(decodeURI('${encodeURI(eventToOutlookCalendar(MoodleEvent, event)).replace(/\s/g, "%20")}'));" title="Add this single event to your Outlook.com Calendar in One click!"><img class="calendarIconMoodle smallicon" alt="outlook calendar icon" src="${chrome.extension.getURL("icons/outlook.png")}"/></a>
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
}
Object.setPrototypeOf(MoodleEvent.prototype, BaseExtractor);

//init on include
Promise.all([asyncGetMoodleTitle(), asyncGetMoodleDescription()])
.then(([nameF, descF]) => {
    // define static methods getName and getDescription
    MoodleEvent.getName = function (event, forUrl) {
        if (forUrl) event = this.convertToURI(event);
        return eval('`' + nameF + '`');
    }

    MoodleEvent.getDescription = function (event, forUrl) {
        if (forUrl) event = this.convertToURI(event);
        console.log(eval('`' + descF + '`'));
        return eval('`' + descF + '`');
    }

    let extractorMoodleEvent = new MoodleEvent();
})
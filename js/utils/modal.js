"use strict";

/**
 * display list of events to present to the user and the download interface
 * @param {Extractor} extractor a Extractor descendant that handled the events
 * @param {Date} from for recurring events when do they start [optional]
 * @param {Date} to for recurring events when do they end [optional]
 * @param {Array} events list of objects that need to have (at least) {from, to, location, download}
 */
function handleEvents(extractor, events, from, to) {
    let repeat = undefined;
    if (from && to && dayDiff(from, to) > 6) {
        repeat = {
            freq: "WEEKLY",
            until: to.toString()
        };
    }
    createModal(extractor, events, repeat);
}

function createModal(extractor, events, repeat) {
    let eventsHtml = "";
    for (let i = 0; i < events.length; i++) {
        // var google_url = eventToGCalendar(extractor, events[i], repeat);
        // var outlook_url = eventToOutlookCalendar(extractor, events[i], repeat);
        eventsHtml += `
        <li>
            <input type="checkbox" id="event_${i}" ${events[i].download?"checked":""}>
            <label for="event_${i}">${extractor.getName(events[i])}</label>
            ${getDropdown(events[i], extractor, repeat, {target: "dropdown_"+i, divClass:"dropdown right removeFrame"})[0].outerHTML}
        </li>`;
    }

    let modal =
        `<div id="sig_eventsModal">
            <div class="sig_modalBody">
                <h1>SigToCa</h1>
                <h2>Select the events you want to download:</h2>
                <ul class="sig_eventsList">
                    ${eventsHtml}
                    <br>
                </ul>
                <hr>
                <div>
                    <a id="sig_downloadIcs" class="calendarBtn"
                        title="Save this to your Calendar">📆 Download .ics</a>
                </div>
            </div>
            <div class="sig_overlay"></div>
        </div>`;
    modal = $(modal);
    $("head").before(modal);
    setDropdownListeners(extractor, repeat);
    modal.find("#sig_downloadIcs").click((e) => {
        updateEvents(modal, events);

        //decide wether to add as single or recurring events (based on the start and end dates supplied)
        let cal = ics(); //creat ics instance
        events.forEach(event => { //iterate events
            if (event.download) //if this event was selected by user -> add it
                cal.addEvent(extractor.getName(event), extractor.getDescription(event), event.location, event.from.toString(), event.to.toString(), repeat);
        }, extractor);

        //donwloas .ics file
        if (!cal.download())
            swal("No event selected for download!", "You need to select at least one event", "warning", {
                buttons: false
            })
        else
            clearModal();
    });
    modal.find(".sig_overlay").click(() => {
        updateEvents(modal, events);
        clearModal();
    });

}

function clearModal() {
    $("#sig_eventsModal").remove();
}

function updateEvents(modal, events) {
    modal.find(".sig_eventsList li").each((index, li) => {
        events[index].download = $(li).find('input[type="checkbox"]').is(":checked")
    });
}
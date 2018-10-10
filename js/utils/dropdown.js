/**
 * Return a Jquery element that has a dropdown and the dropdown buttons for a single event
 * @param {Event} event
 * @param {Context} context the "this" value before (must be an extractor with getName, get Description and isHTML)
 * @param {Object} style an object containg style configurations to be used when creating the dropdown
 */
function getDropdown(event, context, repeat, style) {
    let google_url = eventToGCalendar(context, event, repeat)
    let outlook_url = eventToOutlookCalendar(context, event, repeat)
    let yahoo_url = eventToYahooCalendar(context, event, repeat)

    style = style || {}
    style.target = style.target || "calendarDropdown"
    style.divClass = style.divClass || "dropdown right"
    style.divStyle = style.divStyle || ""
    style.aClass = style.aClass || "calendarBtn dropBtn"

    return $(`
	<div class="${style.divClass}" style="${style.divStyle}">
		<a class="${style.aClass}" target="${style.target}" title="Save this event to your Calendar"><img target="${style.target}" src="${chrome.extension.getURL("icons/calendar.svg")}"/></a>
        <div id="${style.target}" class="dropdown-content">
        ${generateOneClickDOM("", "dropdownIcon", "google", google_url, context.isHTML, "Google").outerHTML}
        ${generateOneClickDOM("", "dropdownIcon", "outlook", outlook_url, context.isHTML, "Outlook").outerHTML}
        ${generateOneClickDOM("", "dropdownIcon", "yahoo", yahoo_url, context.isHTML, "Yahoo").outerHTML}
		<a class="donwloadSingleIcs" data='${JSON.stringify(event).replace(/\'/g,"&#39;")}' style="background-color:#e3e3e3" title="For other calendars, download the single .ics file" href="#"><img class="dropdownIcon" alt="apple calendar icon" src="${chrome.extension.getURL("icons/apple.png")}">Others</a>
		</div>
	</div>`);
}

/**
 * unbind and rebind the listeners for the dropdown buttons
 */
function setDropdownListeners(extractor, repeat) {
    $(".dropBtn > img").unbind().click(toggleDropdown)
    $(".donwloadSingleIcs").unbind().click((e) => {
        let event = JSON.parse($(e.target).attr("data"))
        let cal = ics(); //creat ics instance
        cal.addEvent(extractor.getName(event), extractor.getDescription(event), event.location, event.from.toString() || Date(), event.to.toString() || Date(), repeat);
        if (!cal.download()) swal("No event selected for download!", "You need to select at least one event", "warning", {
            buttons: false
        });
    })
}

/**
 * Toggle dropdown buttons
 */
function toggleDropdown(btn) {
    document.getElementById($(btn.target).attr("target")).classList.toggle("show");
}

// Close the dropdown if the user clicks outside
window.onclick = function(event) {
    if (!event.target.matches('.dropBtn > img')) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}
class ReservationExtractor extends Extractor {
    constructor() {
        super();
        this.ready();
        this.reservationSelector = "#conteudoinner table:nth-of-type(2) tr:nth-of-type(2)";
        this.reservationListSelector = "table.dados table.dados";
    }

    structure() {
        return {
            extractor: "reservations",
            description: "",
            parameters: [
                {
                    name: "from",
                    description: ""
                },
                {
                    name: "to",
                    description: ""
                },
                {
                    name: "location",
                    description: "",
                },
                {
                    name: "room_link",
                    description: ""
                }
            ],
            storage: {
                text: [{
                    name: "title",
                    default: "Gabinete"
                }],
                textarea: [{
                    name: "description",
                    default: "Room: <a href='${room_link}'>${location}</a>"
                }],
                boolean: [{
                    name: "isHTML",
                    default: true
                }]
            }
        }
    }

    attachIfPossible() {
        if (window.location.href.match(/res_recursos_geral.pedidos_view/i))
            this._handleReservation();
        else if (window.location.href.match(/res_recursos_geral.pedidos_list/i))
            this._handleListReservations();
        else
            console.warn("Unknown location. ReservationExtractor doesn't recognize this page");
    }

    _handleReservation() {
        // create the event
        let event = this._getEvent();
        // create styles to override default dropdown rules
        let style = {
            divClass: "dropdown removeFrame",
            divStyle: "display:contents;",
            dropdownStyle: "position: absolute;"
        }
        // create the dropdown and table cell. append it on the Sigarra's table
        let dropDownEl = getDropdown(event, this, null, style);
        let td = document.createElement("td");
        td.append(dropDownEl[0]);
        document.querySelector(this.reservationSelector).append(td);
        // attach event listeners
        setDropdownListeners(this, undefined);
    }

    _handleListReservations() {
        // get all events
        const events = this._getEventsFromList();
        // create button element
        let saveBtn = $(`
            <a class="calendarBtn" style="width: 5rem;" title="Save exams to your Calendar">
                <img src="${chrome.extension.getURL("icons/calendar.svg")}"/>
            </a>`
        );
        // inject button
        $('#conteudoinner > table.dados').before(saveBtn);
        saveBtn.click(() => {
            handleEvents(this, events);
        });
    }

    _getEvent() {
        let row_el = document.querySelector(this.reservationSelector).children;
        let date = row_el[0].innerText;
        let hour_from = row_el[2].innerText;
        let hour_to = row_el[3].innerText;
        let room = row_el[5].innerText;
        let room_link = row_el[5].querySelector('a').href;

        return {
            from: new Date(`${date} ${hour_from}`),
            to: new Date(`${date} ${hour_to}`),
            location: room,
            room_link: room_link
        }
    }

    /**
     * Parses the list of reservations and creates an array of events
     * 
     * @return {{from: Date, to:Date, location: string, room_link: string}[]}
     */
    _getEventsFromList() {
        const reservations = document.querySelectorAll(this.reservationListSelector);
        let events = [];
        for (let res of reservations) {
            // the table row node, <td>, that has the desired data (date, start/end time, room, ...)
            const tableRowEl = res.querySelector('tr:nth-of-type(2)');
            // extract information from the node and append the event object
            events.push(this._parseEventFromTableRow(tableRowEl));
        }
        return events;
    }

    /**
     * Parses a table row that among other details contains
     * - date (typically in yyyy-mm-dd format)
     * - weekday name (e.g. Monday)
     * - start time (e.g 9:00)
     * - end time
     * - duration
     * - room (e.g C605)
     * 
     * Example:
     * ```
     * <tr ...>
     *  <td ...>2020-02-10</td>
     *  <td ...><span class="textopequeno">Segunda</span></td>
     *  <td ...>09:00</td>
     *  <td ...>17:00</td>
     *  <td ...>08:00</td>
     *  <td ...><a href="..." ...>C613</a></td>
     * </tr>
     * ```

     * @param {HTMLElement} node 
     * @returns {}
     */
    _parseEventFromTableRow(node) {
        const data_nodes = node.children;
        const date = data_nodes[0].innerText;
        const start_time = data_nodes[2].innerText;
        const end_time = data_nodes[3].innerText;
        const room = data_nodes[5].innerText;
        const room_link = data_nodes[5].querySelector('a').href;

        return {
            from: new Date(`${date} ${start_time}`),
            to: new Date(`${date} ${end_time}`),
            location: room,
            room_link: room_link
        }
    }

    convertToURI(event) {
        return event;
    }
}

// add an instance to the EXTRACTORS variable, and also trigger attachIfPossible due to constructor
EXTRACTORS.push(new ReservationExtractor());
class ReservationExtractor extends Extractor {
    constructor() {
        super();
        this.ready();
        this.reservationSelector = "#conteudoinner table:nth-of-type(2) tr:nth-of-type(2)";
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
        this._handleReservation();
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

    convertToURI(event) {
        return event;
    }
}

// add an instance to the EXTRACTORS variable, and also trigger attachIfPossible due to constructor
EXTRACTORS.push(new ReservationExtractor());
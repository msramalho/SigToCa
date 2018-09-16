"use strict";

class DataTable extends Extractor {
    constructor() {
        super();
        this.tables = $("table.dados,table.dadossz,table.tabela:has( tr.i)").toArray();
        this.loading = false // indicates when there is an ongoing ajax request
        this.ready();
    }

    structure() {
        return {
            extractor: "datatable",
            description: "Makes tables that are typically static be sortable, searchable and exportable in copy-paste, csv, excel and print mode",
            // parameters: [],
            storage: {
                boolean: [{
                        name: "apply",
                        default: true
                    },
                    {
                        name: "disable_one_row",
                        default: true
                    }
                ]
            }
        }
    }


    attachIfPossible() {
        $.each(this.tables, (_, t) => this.attachTableIfPossible($(t)))
    }

    attachTableIfPossible(table) {
        // return if table not found or not applied
        if (!this.apply) return console.info("Infinite scroll not applied. To apply go to options. ")
        if (!table.length || !this.validTable(table)) return
        if (!table.find("tr").toArray().length) return //if table is empty
        if (this.disable_one_row && table.find("tr").toArray().length == 2) return //if table only has header and one row

        // remove sigarra stuff that is useless
        $("#ordenacao").remove()
        $("th a").remove()

        // inject dynamic tables
        table.prev().after($(`<h2 class="noBorder">SigTools Dynamic Tables</h2>`))
        table.prepend($(`<thead>${table.find("tr").html()}</thead>`))
        table.find("tbody tr:has(> th)").remove()

        // sorting guide: https://www.datatables.net/plug-ins/sorting/
        table.dataTable(DataTable.datatableOptions);
    }

    /**
     * Check if the current table is valid for applying datatables
     */
    validTable(table) {
        let cols = table.find("tr:has(> th)").find("th").toArray().length
        let first = table.find("tr:has(> td)").eq(0).find("td").toArray().length
        return cols == first && table.find("td[rowspan],td[colspan]").length == 0
    }
}

// static property: options to use in the datatable calls
DataTable.datatableOptions = {
    paging: false,
    order: [],
    dom: 'Bfrtip',
    buttons: ['copyHtml5', {
        extend: 'csvHtml5',
        charset: 'UTF-8',
        bom: true
    }, {
        extend: 'excelHtml5',
        charset: 'UTF-8',
        bom: true
    }, 'print'],
}

/**
 * if a datatble exists, remove it and return a callback to apply it again
 * @param {string} selector
 */
function removeDatatableIfExists(selector) {
    if ($.fn.dataTable.isDataTable(selector)) {
        let table = $(selector).DataTable()
        table.destroy()
        return el => el.dataTable(DataTable.datatableOptions)
    }
    return (_) => {}
}

// add an instance to the EXTRACTORS variable, and also trigger attachIfPossible due to constructor
EXTRACTORS.push(new DataTable());
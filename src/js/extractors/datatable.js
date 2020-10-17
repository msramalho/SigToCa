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
            description: "Makes tables that are typically static become sortable, searchable and exportable in copy-paste, csv, excel and print mode",
            parameters: [],
            storage: {
                boolean: [{
                    name: "disable_one_row",
                    default: true
                }],
                text: [{
                    name: "exclude_urls_csv",
                    default: "coop_candidatura_geral.editar_candidatura"
                }]
            }
        }
    }


    attachIfPossible() {
        $.each(this.tables, (_, t) => this.attachTableIfPossible($(t)))
    }

    attachTableIfPossible(table) {
        // return if table not found or not applied
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
        this.performCustomValidation(table)
        let cols = table.find("tr:has(> th)").find("th").toArray().length
        let first = table.find("tr:has(> td)").eq(0).find("td").toArray().length
        return cols == first && table.find("td[rowspan],td[colspan]").length == 0
    }

    /**
     * Call specific functions for specific pages with strange tables
     */
    performCustomValidation(table) {
        if(this.url.includes("coop_candidatura_geral.ver_colocacoes_aluno")) this.transformErasmus(table)
    }

    /**
     * Fix table for the erasmus listings page
     * @param {Table} table
     */
    transformErasmus(table){
        $(table.find("tr:first-child th[colspan=2]").replaceWith(table.find("tr:nth-child(2)").html()))
        table.find("tr:nth-child(2)").remove()
        table.find('th[rowspan=2]').attr('rowspan', '1');
    }
}

// static property: options to use in the datatable calls
DataTable.datatableOptions = {
    paging: false,
    order: [],
    /**
     * Define the table control elements to appear on the page and in what order
     * @see {@link https://datatables.net/reference/option/dom}
     *
     * Moreover, we also use this to wrap around DataTable elements in `div`s with
     * our own class names. This enables us to create CSS rules with more specificity
     * thus overriding the library defaults with more ease
     *
     * 1. A wrapper div with class 'SigTools__dt'
     * 2. B -> the buttons for copying and exporting table data
     * 3. f -> filter inputs (search box)
     * 4. r -> ?
     * 5. t -> the table itself with class 'SigTools__dt__table'
     * 6. i -> information summary
     * 7. p -> pagination control
     */
    dom: `<"SigTools__dt"Bfr<"SigTools__dt__table"t>ip>`,
    buttons: ['copyHtml5', 'print', {
        extend: 'csvHtml5',
        charset: 'UTF-8',
        bom: true
    }, {
            extend: 'excelHtml5',
            charset: 'UTF-8',
            bom: true
        }
    ],
}

/**
 * if a datatable exists, remove it and return a callback to apply it again
 * @param {string} selector
 */
function removeDatatableIfExists(selector) {
    if ($.fn.dataTable.isDataTable(selector)) {
        let table = $(selector).DataTable()
        table.destroy()
        return el => el.dataTable(DataTable.datatableOptions)
    }
    return (_) => { }
}

// add an instance to the EXTRACTORS variable, and also trigger attachIfPossible due to constructor
EXTRACTORS.push(new DataTable());
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
        if (!this.validTable(table))
            return;

        // remove sigarra stuff that is useless
        $("#ordenacao").remove()
        $("th a").remove()

        /**
         * In order to DataTables work properly, we must have a <thead> element
         * Some tables in Sigarra have it, others don't.
         * When the <thead> is missing, and if the table consists of multiple
         * table rows, `<tr>`, the first one could be a header row. If it is,
         * all child elements are table header cells, `<th>`.
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table}
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr}
         */
        if (!table.find("> thead").length) {
            // <thead> is missing. try to find a "header row", i.e. a <tr> consisting
            // of <th> cells only
            const $theader = table.find("tr").filter(function (_, elem) {
                return $(elem).children("th").length === $(elem).children().length
            });

            // check if any header row was found. if not, return
            if (!$theader.length)
                return;

            // remove current header
            $theader.remove();

            // wrap previous header row in <thead>
            table.prepend(`<thead>${$theader.html()}</thead>`);
        }

        // inject dynamic tables title
        table.prev().after($(`<h2 class="noBorder">SigTools Dynamic Tables</h2>`))
        // sorting guide: https://www.datatables.net/plug-ins/sorting/
        table.dataTable(DataTable.datatableOptions);
    }

    /**
     * Check if the current table is valid for applying datatables
     */
    validTable(table) {
        // check if table is not empty
        if (table.find("tr").toArray().length === 0)
            return false;

        // check if table has single row. such tables can be blacklisted by the user
        if (this.disable_one_row && table.find("tr").toArray().length <= 2)
            return false;

        // check if table is missing the <thead>, as required by DataTables lib
        // TODO

        // modify tables to make them valid
        this.performCustomValidation(table)


        //let cols = table.find("tr:has(> th)").find("th").toArray().length
        //let first = table.find("tr:has(> td)").eq(0).find("td").toArray().length
        //return cols == first && table.find("td[rowspan],td[colspan]").length == 0
        return true;
    }

    /**
     * 
     * @param {*} $table 
     * @returns 
     */
    __getHeaderRows($table) {
        /** A table row, `<tr>` is a header row, if all children nodes are `<th>` cells */
        const isHeaderRow = ($r) => $r.find("th").length === $r.children().length;
        // find the first table row (not necessarially the first table children (e.g. <caption>))
        const $firstRow = $table.find("tr:first-child");
        // if the first table row is a header row, iterate over the sibling table rows while they are headers
        if (isHeaderRow($firstRow)) {
            // iterate over the sibling rows, and collect the header ones
            const $rows = $firstRow.find("~ tr");
            const $headerRows = [$firstRow];
            for (let i = 0; i < $rows.length; i++) {
                if (isHeaderRow($($rows[i])))
                    $headerRows.push($($rows[i]));
                else
                    break;
            }
            return $headerRows;
        } else {
            return [];
        }
    }

    /**
     * Call specific functions for specific pages with strange tables
     */
    performCustomValidation(table) {
        if (this.url.includes("coop_candidatura_geral.ver_colocacoes_aluno")) this.transformErasmus(table)
    }

    /**
     * Fix table for the erasmus listings page
     * @param {Table} table
     */
    transformErasmus(table) {
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
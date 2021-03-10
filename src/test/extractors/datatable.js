//var assert = require('chai').assert;

describe("Datatables", () => {

    describe("Test all valid tables", () => {
        let dt = null;

        /**
         * Loads sample file with multiple valid tables
         */
        before(() => {
            return new Promise((resolve) =>
                updatejQueryContext("test/pages/datatables/all-valid.html").then(() => {
                    dt = new DataTable();
                    dt.attachIfPossible();
                    resolve();
                }));
        })

        /**
         * Ensure the extractor finds all possible tables
         */
        it("Find all candidate HTML tables", () => {
            chai.assert.isArray(dt.tables, "tables is array");
            chai.assert.equal(dt.tables.length, 4, "Failed to detect all candidate tables");
        })

        /**
         * Test the table validator utility function
         */
        it("Test table validator function", () => {
            for (const t of dt.tables) {
                chai.assert.isTrue(dt.validTable($(t)), "Failed validation on " + t.id);
            }
        });

        /**
         * Check DataTable lib loads correctly on all candidate tables
         */
        it("Check DataTable loads correctly on all candidates", () => {
            /** if DataTables lib applied on table correctly, then the <table> node has a new class "dataTable" */
            for (const t of dt.tables) {
                chai.assert.include(t.getAttribute("class"), "dataTable", "DataTable not loaded");
            }
        })

        /**
         * Check if the <table> node is wrapped with a <div>, created to facilitate CSS customization
         */
        it("Check table is wrapped", () => {
            // Table node must be wrapped on a div.SigTools__dt__table
            for (const t of dt.tables) {
                chai.assert.equal(t.parentElement.getAttribute("class"), "SigTools__dt__table", "DataTable not wrapped");
            }
        })

        /**
         * Check if <table> node and all DataTable elements (filters, buttons) are wrapped in a <div> element
         */
        it("Check table and DataTable are wrapped", () => {
            // Table node and parent DataTable nodes must be wrapped on a div.SigTools__dt__table
            for (const t of dt.tables) {
                chai.assert.equal(t.parentElement.parentElement.getAttribute("class"), "SigTools__dt", "DataTable not wrapped");
            }
        })
    })

    describe("Test singlerow", () => {
        it("Single row not disabled", () => {
            updatejQueryContext("test/pages/datatables/single_row.html").then(() => {
                dt = new DataTable();
                dt.disable_one_row = false;
                for (const t of dt.tables) {
                    chai.assert.isTrue(dt.validTable($(t)));
                }
            });
        })

        it("Single row disabled", () => {
            updatejQueryContext("test/pages/datatables/single_row.html").then(() => {
                dt = new DataTable();
                dt.disable_one_row = true;
                for (const t of dt.tables) {
                    chai.assert.isFalse(dt.validTable($(t)));
                }
            });
        })
    })
})
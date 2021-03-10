describe("Datatables", function () {
    describe("Out-of-the-box valid tables", function () {
        /**
         * Loads sample file with multiple valid tables
         */
        before(function () {
            return new Promise((resolve) =>
                updatejQueryContext("test/pages/datatables/all_valid.html").then(() => {
                    this.dt = new DataTable();
                    this.dt.attachIfPossible();
                    resolve();
                })
            );
        });

        /**
         * Ensure the extractor finds all possible tables
         */
        it("Find all candidate HTML tables", function () {
            chai.assert.isArray(this.dt.tables, "tables is array");
            chai.assert.equal(this.dt.tables.length, 3, "Failed to detect all candidate tables");
        })

        /**
         * Test the table validator utility function
         */
        it("Test table validator function", function () {
            for (const t of this.dt.tables) {
                chai.assert.isTrue(this.dt.validTable($(t)), "Failed validation on " + t.id);
            }
        });

        /**
         * Check DataTable lib loads correctly on all candidate tables
         */
        it("Check DataTable loads correctly on all candidates", function () {
            /** if DataTables lib applied on table correctly, then the <table> node has a new class "dataTable" */
            for (const t of this.dt.tables) {
                chai.assert.include(
                    t.getAttribute("class"),
                    "dataTable",
                    "DataTable not loaded"
                );
            }
        });

        /**
         * Check if the <table> node is wrapped with a <div>, created to facilitate CSS customization
         */
        it("Check table is wrapped", function () {
            // Table node must be wrapped on a div.SigTools__dt__table
            for (const t of this.dt.tables) {
                chai.assert.equal(
                    t.parentElement.getAttribute("class"),
                    "SigTools__dt__table",
                    "DataTable not wrapped"
                );
            }
        });

        /**
         * Check if <table> node and all DataTable elements (filters, buttons) are wrapped in a <div> element
         */
        it("Check table and DataTable are wrapped", function () {
            // Table node and parent DataTable nodes must be wrapped on a div.SigTools__dt__table
            for (const t of this.dt.tables) {
                chai.assert.equal(
                    t.parentElement.parentElement.getAttribute("class"),
                    "SigTools__dt",
                    "DataTable not wrapped"
                );
            }
        });
    });

    describe("Single row feature (user setting)", function () {
        it("Single row not disabled", function () {
            updatejQueryContext("test/pages/datatables/single_row.html").then(() => {
                const dt = new DataTable();
                dt.disable_one_row = false;
                for (const t of dt.tables) {
                    chai.assert.isTrue(dt.validTable($(t)));
                }
            });
        });

        it("Single row disabled", function () {
            updatejQueryContext("test/pages/datatables/single_row.html").then(() => {
                const dt = new DataTable();
                dt.disable_one_row = true;
                for (const t of dt.tables) {
                    chai.assert.isFalse(dt.validTable($(t)));
                }
            });
        });
    });

    describe("Test tables with implicit headers", function () {
        before(function () {
            return new Promise((resolve) =>
                updatejQueryContext("test/pages/datatables/implicit_headers.html").then(
                    () => {
                        this.dt = new DataTable();
                        resolve();
                    }
                )
            );
        });

        it("Find implicit headers", function () {
            const customAssert = (tableId, numHeaderRows, msg) => {
                const $t = $(`#${tableId}`).first();
                const $h = this.dt.__getHeaderRows($t);
                chai.assert.strictEqual(
                    $h.length,
                    numHeaderRows,
                    msg || `Table #${tableId} has ${numHeaderRows} header row(s)`
                );
                return $h;
            };

            customAssert("table-implicit-header-1", 1);
            customAssert("table-implicit-header-2", 1);
            customAssert("table-implicit-header-3", 2);
            customAssert("table-implicit-header-4", 2);
            customAssert("table-no-header-1", 0);
            customAssert("table-no-header-2", 0);
            // double check it catched the correct top header row
            chai.assert.strictEqual(customAssert("table-implicit-header-5", 1)[0][0].getAttribute("class"), "first");
        });
    });
});
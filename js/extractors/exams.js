//https://sigarra.up.pt/feup/pt/exa_geral.mapa_de_exames?p_curso_id=742
"use strict";
class ExamsTimetable {
    constructor() {
        this.table = $("table.dados:not(.mapa)").add("table.dadossz:not(.mapa)");
        this.exams = new Array(this.table.length);
    }

    attachIfPossible() {
        if (this.table) {
            this.table.each((index, table) => {
                table = $(table);
                this.exams[index] = this.exams[index] == undefined ? this.getEvents(index) : this.exams[index];
                if (this.exams[index].events.length != 0) {
                    let saveBtn = $('<a class="calendarBtn" title="Save this To your Calendar">📆</a>');
                    table.before(saveBtn);
                    saveBtn.click((e) => {
                        handleEvents(this, this.exams[index].events);
                    });
                }
            });
        }
    }

    getEvents(index) {
        return {
            info: jTry(() => {
                    return $(this.table.eq(index).parents("table")[0]).prev("h3").html().split(" ")[0];
                },
                "Exam"),
            events: this.table.eq(index).parseExamTable()
        };
    }

    convertToURI(original) {
        let event = jQuery.extend(true, {}, original);
        event.subject.name = encodeURIComponent(event.subject.name);
        event.info = encodeURIComponent(event.info);
        event.subject.url = encodeURIComponent(event.subject.url);
        return event;
    }

    static getEvent(day, exameTd) {
        //calculate the start and end times
        let hours = exameTd.html().match(/\d+:\d+-\d+:\d+/g)[0].replace("-", " - ");
        let start = new Date(day.getTime());
        start = start.setHoursMinutes(hours, 0);
        let end = new Date(day.getTime());
        end = end.setHoursMinutes(hours, 1);
        //get other variables from the html
        let subjectInfo = exameTd.find("a:first-child()");
        return {
            from: start,
            to: end,
            location: jTry(() => {
                return exameTd.find("span.exame-sala").text();
            }, "(No Room)"),
            download: false,
            info: jTry(() => {
                return exameTd.closest("table:not(.dados)").prev("h3").html();
            }, "Exam"),
            subject: {
                name: subjectInfo.attr("title"),
                acronym: subjectInfo.text(),
                url: subjectInfo[0].href
            }
        };
    }
}
Object.setPrototypeOf(ExamsTimetable.prototype, BaseExtractor);

$.prototype.parseExamTable = function() {
    let exams = [];

    this.find("> tbody > tr > th").each((rowIndex, row) => { //iterate each th
        let date = new Date($(row).find("span.exame-data").text());
        let correspTr = this.find(`tbody > tr > td.l.k:eq(${rowIndex})`);
        let correspTable = correspTr.find("table.dados.mapa");
        if (correspTable != undefined) {
            correspTable.find("td.exame").each((exameIndex, exameTd) => {
                exams.push(ExamsTimetable.getEvent(date, $(exameTd)));
            });
        }
    });

    return exams;
};


asyncGetExam()
    .then((exam) => {
        ExamsTimetable.prototype.getName = function(event, forUrl) {
            if (forUrl) event = this.convertToURI(event);

            //In case some of the attributes are undefined, replace it with 'n/a'
            return parseStrFormat(event, exam.title, exam.isHTML);
        }

        ExamsTimetable.prototype.getDescription = function(event, forUrl) {
            if (forUrl) event = this.convertToURI(event);

            //In case some of the attributes are undefined, replace it with 'n/a'
            return parseStrFormat(event, exam.desc, exam.isHTML);
        }

        ExamsTimetable.prototype.isHTML = function() {
            return exam.isHTML;
        }

        //init on include
        let extractorExamsTimetable = new ExamsTimetable();
        extractorExamsTimetable.attachIfPossible();
    })
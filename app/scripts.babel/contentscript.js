'use strict';

$(document).ready(function () {
    $('#ptifrmtgtframe').bind('load change', function () {
        var iframe = $('#ptifrmtgtframe').contents();
        // call on "Search" button clicked
        $(iframe).delegate('#win0divDERIVED_SSTSNAV_SSS_SUBFOOT_LINKS', 'click', function () {
            getClassSchedule();
        });
    });
    $('#ptifrmtgtframe').trigger('change');
});

//get each schedule and build up the complete calendar 
function getClassSchedule() {
    var iframe = $('#ptifrmtgtframe').contents();
    var existsInIframe = iframe.find('#ACE_STDNT_ENRL_SSV2\\$0');
    if (existsInIframe.length > 0) {
        var hold_events = [];
        var startCalendar = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-TIMEZONE:America/New_York',
        'TZID:America/New_York',
        'X-LIC-LOCATION:America/New_York'
    ];
        var endCalendar = [
        'END:VCALENDAR'
    ];
        existsInIframe.find('div[id*="win0divDERIVED_REGFRM1_DESCR20"]').each(function (index, value) {
            var status = $(value).find('div[id="win0divSTATUS\\$' + index + '"]').text();
            if (status.trim() == 'Enrolled') {
                var class_name = $(value).find('td[class="PAGROUPDIVIDER"]').text();
                var cell = $(value).find('tr[id*="trCLASS_MTG_VW\\$' + index + '"]').each(function (i, v) {
                    var class_number = $(v).find('span[id*="DERIVED_CLS_DTL_CLASS_NBR"]').text();
                    var section = $(v).find('span[id*="MTG_SECTION"]').text();
                    var comp = $(v).find('span[id*="MTG_COMP"]').text();
                    var schedule = $(v).find('span[id*="MTG_SCHED"]').text();
                    var location = $(v).find('span[id*="MTG_LOC"]').text();
                    var inst = $(v).find('span[id*="DERIVED_CLS_DTL_SSR_INSTR_LONG"]').text();
                    var dates = $(v).find('span[id*="MTG_DATES"]').text();
                    hold_events.push(buildEvent(class_name, class_number, section, comp, schedule, location, inst.trim(), dates));
                });
            }
        });
        var calendar = startCalendar.concat(hold_events, endCalendar).join('\r\n');
        console.log(calendar);

    } else {
        setTimeout(getClassSchedule, 2000);
    }
}

//convert string to days in MO, FR format
function toDays(schedule) {
    var day = [];
    for (var i = 0, len = schedule.length; i < len; i += 2) {
        day.push(schedule.substring(i, i + 2));
    }
    return day.join().toUpperCase()
}
// convert time to ISO time
function to24Hour(time) {
    time = time.split(/(AM|PM)/i).join(' ');
    var t = new Date("2016-03-14 " + time);
    return "T" + t.getHours() + ('0' + t.getMinutes()).slice(-2) + "00Z";
}
//build each event
function buildEvent(class_name, class_number, section, comp, schedule, location, inst, dates) {
    var descriptions = class_name + "-" + comp + " \n Section: " + section + " \n " + schedule + " \n Location: " + location + " \n Instructors: " + inst.replace(/(\r\n|\n|\r)/gm, "");
    //separate the dates
    var reg = /\w+/i;
    var m_days = toDays(reg.exec(schedule)[0]);
    dates = dates.trim().split('-');
    var start_date = dates[0].split('/');
    start_date = start_date[2] + start_date[0] + start_date[1];
    start_date = start_date.replace(' ', '');
    var end_date = dates[1].split('/');
    end_date = end_date[2] + end_date[0] + end_date[1];
    end_date = end_date.replace(' ', '');
    //seperate the time
    var m_time = schedule.split(reg.exec(schedule))[1].trim();
    m_time = m_time.trim().split('-');
    var start_time = to24Hour(m_time[0].trim());
    var end_time = to24Hour(m_time[1].trim());

    var calendarEvent = [
        'BEGIN:VEVENT',
        'DTSTART;TZID=America/New_York:' + start_date + start_time,
        'DTEND;TZID=America/New_York:' + start_date + end_time,
        'RRULE:FREQ=WEEKLY;UNTIL=' + end_date + end_time + ';BYDAY=' + m_days,
        'DTSTAMP:' + start_date + start_time,
        'DESCRIPTION:' + descriptions,
        'LOCATION:' + location + '\ Stony Brook\ NY\ US',
        'SEQUENCE:1',
        'STATUS:CONFIRMED',
        'SUMMARY:' + class_name + " - " + comp,
        'TRANSP:OPAQUE',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:-P0DT0H15M0S',
        'END:VALARM',
        'END:VEVENT'
     ];
    return calendarEvent.join('\r\n');
}
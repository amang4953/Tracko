/**
 * Classic Gray Habit Tracker Generator
 * 
 * Instructions:
 * 1. Open Google Sheets (sheets.google.com).
 * 2. Create a new blank spreadsheet.
 * 3. Go to Extensions -> Apps Script.
 * 4. Delete any default code in Code.gs.
 * 5. Paste this entire script into the editor.
 * 6. Click the Save icon (floppy disk) and then click "Run" (make sure setupHabitTracker is selected in the toolbar).
 * 7. Authorize permissions when prompted (Advanced -> Go to Untitled project -> Allow).
 * 8. The script will generate the complete dashboard and habit tracker.
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Habit Tracker')
      .addItem('Setup / Reset Tracker', 'setupHabitTracker')
      .addToUi();
}

function setupHabitTracker() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 1. Clear sheet contents, formats, notes, and charts
  sheet.clear();
  sheet.clearNotes();
  var charts = sheet.getCharts();
  for (var i = 0; i < charts.length; i++) {
    sheet.removeChart(charts[i]);
  }
  
  // Set tab color to slate gray
  sheet.setTabColor("#71717a");
  sheet.setHideGridlines(false);
  
  // 2. Set Row Heights
  for (var r = 1; r <= 6; r++) sheet.setRowHeight(r, 24); // Dashboard cards rows
  sheet.setRowHeight(7, 22);   // Weeks header row
  sheet.setRowHeight(8, 20);   // Days names row
  sheet.setRowHeight(9, 20);   // Days numbers row
  for (var r = 10; r <= 21; r++) sheet.setRowHeight(r, 22); // Habit rows
  sheet.setRowHeight(22, 18);  // Hidden helper row
  sheet.setRowHeight(23, 22);  // Mental State header
  sheet.setRowHeight(24, 22);  // Mood input row
  sheet.setRowHeight(25, 22);  // Motivation input row
  for (var r = 26; r <= 35; r++) sheet.setRowHeight(r, 20); // Mental State chart area rows
  
  // 3. Set Column Widths
  sheet.setColumnWidth(1, 180); // Column A: Habits Name
  for (var c = 2; c <= 32; c++) {
    sheet.setColumnWidth(c, 26); // Columns B to AF: Days 1 to 31
  }
  sheet.setColumnWidth(33, 52); // Column AG: Goal
  sheet.setColumnWidth(34, 52); // Column AH: Actual
  sheet.setColumnWidth(35, 52); // Column AI: Left
  sheet.setColumnWidth(36, 85); // Column AJ: Progress Bar (Sparkline)
  sheet.setColumnWidth(37, 55); // Column AK: Percentage (%)
  sheet.setColumnWidth(38, 80); // Column AL: Helper labels
  sheet.setColumnWidth(39, 55); // Column AM: Helper values
  
  // 4. Create Card 1: Title Card (A1:E3)
  var titleRange = sheet.getRange("A1:E3");
  titleRange.merge();
  titleRange.setBackground("#71717a");
  titleRange.setFontColor("#ffffff");
  titleRange.setFontFamily("Roboto");
  titleRange.setFontWeight("bold");
  titleRange.setFontSize(14);
  titleRange.setHorizontalAlignment("center");
  titleRange.setVerticalAlignment("middle");
  titleRange.setWrap(true);
  titleRange.setFormula('="HABIT TRACKER\n--"&C6&"--"');
  
  // 5. Create Card 2: Calendar Settings Card (A4:E6)
  var settingsHeader = sheet.getRange("A4:E4");
  settingsHeader.merge();
  settingsHeader.setValue("CALENDAR SETTINGS");
  settingsHeader.setBackground("#52525b");
  settingsHeader.setFontColor("#ffffff");
  settingsHeader.setFontFamily("Roboto");
  settingsHeader.setFontWeight("bold");
  settingsHeader.setFontSize(9);
  settingsHeader.setHorizontalAlignment("center");
  settingsHeader.setVerticalAlignment("middle");
  
  // Year row
  var yearLabel = sheet.getRange("A5:B5");
  yearLabel.merge();
  yearLabel.setValue("YEAR");
  yearLabel.setBackground("#71717a");
  yearLabel.setFontColor("#ffffff");
  yearLabel.setFontFamily("Roboto");
  yearLabel.setFontWeight("bold");
  yearLabel.setFontSize(9);
  yearLabel.setHorizontalAlignment("center");
  yearLabel.setVerticalAlignment("middle");
  
  var yearValue = sheet.getRange("C5:E5");
  yearValue.merge();
  yearValue.setValue(2026);
  yearValue.setBackground("#ffffff");
  yearValue.setFontColor("#18181b");
  yearValue.setFontFamily("Roboto");
  yearValue.setFontWeight("bold");
  yearValue.setFontSize(10);
  yearValue.setHorizontalAlignment("center");
  yearValue.setVerticalAlignment("middle");
  
  // Month row
  var monthLabel = sheet.getRange("A6:B6");
  monthLabel.merge();
  monthLabel.setValue("MONTH");
  monthLabel.setBackground("#71717a");
  monthLabel.setFontColor("#ffffff");
  monthLabel.setFontFamily("Roboto");
  monthLabel.setFontWeight("bold");
  monthLabel.setFontSize(9);
  monthLabel.setHorizontalAlignment("center");
  monthLabel.setVerticalAlignment("middle");
  
  var monthValue = sheet.getRange("C6:E6");
  monthValue.merge();
  monthValue.setValue("JANUARY");
  monthValue.setBackground("#ffffff");
  monthValue.setFontColor("#18181b");
  monthValue.setFontFamily("Roboto");
  monthValue.setFontWeight("bold");
  monthValue.setFontSize(10);
  monthValue.setHorizontalAlignment("center");
  monthValue.setVerticalAlignment("middle");
  
  // Apply borders to Left side Cards (Title & Settings)
  sheet.getRange("A1:E3").setBorder(true, true, true, true, false, false, "#71717a", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("A4:E6").setBorder(true, true, true, true, true, true, "#71717a", SpreadsheetApp.BorderStyle.SOLID);
  
  // 6. Create Empty Card panels for charts
  sheet.getRange("F1:U6").merge().setBackground("#e4e4e7").setBorder(true, true, true, true, false, false, "#71717a", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.getRange("V1:AA6").merge().setBackground("#e4e4e7").setBorder(true, true, true, true, false, false, "#71717a", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.getRange("AD1:AK6").merge().setBackground("#e4e4e7").setBorder(true, true, true, true, false, false, "#71717a", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // 7. Create Card 5: Stats Counter Card (AB1:AC6)
  var statsKeys = ["GOAL", "=COUNT(B$9:AF$9) * COUNTA(A$10:A$21)", "COMPLETED", "=COUNTIF(B$10:AF$21, TRUE)", "LEFT", "=AB2-AB4"];
  for (var k = 0; k < 6; k++) {
    var statRange = sheet.getRange(k + 1, 28, 1, 2);
    statRange.merge();
    statRange.setValue(statsKeys[k]);
    if (k % 2 === 0) { // Labels
      statRange.setBackground("#52525b");
      statRange.setFontColor("#ffffff");
      statRange.setFontFamily("Roboto");
      statRange.setFontWeight("bold");
      statRange.setFontSize(8);
    } else { // Values
      statRange.setBackground("#ffffff");
      statRange.setFontColor("#18181b");
      statRange.setFontFamily("Roboto");
      statRange.setFontWeight("bold");
      statRange.setFontSize(11);
    }
    statRange.setHorizontalAlignment("center");
    statRange.setVerticalAlignment("middle");
  }
  sheet.getRange("AB1:AC6").setBorder(true, true, true, true, true, true, "#71717a", SpreadsheetApp.BorderStyle.SOLID);
  
  // 8. Main Tracker Header Rows (Row 7, 8, 9)
  // My Habits Header A7:A9
  var habitHeader = sheet.getRange("A7:A9");
  habitHeader.merge();
  habitHeader.setValue("My Habits");
  habitHeader.setBackground("#71717a");
  habitHeader.setFontColor("#ffffff");
  habitHeader.setFontFamily("Roboto");
  habitHeader.setFontWeight("bold");
  habitHeader.setFontSize(10);
  habitHeader.setHorizontalAlignment("center");
  habitHeader.setVerticalAlignment("middle");
  
  // Weeks merged headers (Row 7)
  var weeks = [
    { range: "B7:H7", val: "Week 1" },
    { range: "I7:O7", val: "Week 2" },
    { range: "P7:V7", val: "Week 3" },
    { range: "W7:AC7", val: "Week 4" },
    { range: "AD7:AF7", val: "Week 5" },
    { range: "AG7:AK7", val: "Analysis" }
  ];
  weeks.forEach(function(wk) {
    var r = sheet.getRange(wk.range);
    r.merge();
    r.setValue(wk.val);
    r.setBackground("#52525b");
    r.setFontColor("#ffffff");
    r.setFontFamily("Roboto");
    r.setFontWeight("bold");
    r.setFontSize(9);
    r.setHorizontalAlignment("center");
    r.setVerticalAlignment("middle");
  });
  
  // Day Numbers (Row 9)
  // B9: `=DATE($C$5, MONTH(1&$C$6), 1)`
  sheet.getRange("B9").setFormula("=DATE($C$5, MONTH(1&$C$6), 1)");
  for (var c = 3; c <= 32; c++) {
    var colLetterPrev = getColumnLetter(c - 1);
    sheet.getRange(9, c).setFormula("=IF(" + colLetterPrev + "9=\"\", \"\", IF(MONTH(" + colLetterPrev + "9+1)=MONTH($B$9), " + colLetterPrev + "9+1, \"\"))");
  }
  
  // Day Names (Row 8)
  for (var c = 2; c <= 32; c++) {
    var colLetter = getColumnLetter(c);
    sheet.getRange(8, c).setFormula("=IF(" + colLetter + "9=\"\", \"\", LEFT(TEXT(" + colLetter + "9, \"ddd\"), 2))");
  }
  
  // Format Row 8 and Row 9 header cells
  var daysHeaderRange = sheet.getRange("B8:AF9");
  daysHeaderRange.setBackground("#71717a");
  daysHeaderRange.setFontColor("#ffffff");
  daysHeaderRange.setFontFamily("Roboto");
  daysHeaderRange.setFontWeight("bold");
  daysHeaderRange.setFontSize(8);
  daysHeaderRange.setHorizontalAlignment("center");
  daysHeaderRange.setVerticalAlignment("middle");
  daysHeaderRange.setNumberFormat("d"); // Show only day numbers in Row 9
  
  // Analysis Subheaders
  var analysisSubheaders = [
    { range: "AG8:AG9", val: "GOAL" },
    { range: "AH8:AH9", val: "ACTUAL" },
    { range: "AI8:AI9", val: "LEFT" },
    { range: "AJ8:AJ9", val: "PROGRESS" },
    { range: "AK8:AK9", val: "%" }
  ];
  analysisSubheaders.forEach(function(sub) {
    var r = sheet.getRange(sub.range);
    r.merge();
    r.setValue(sub.val);
    r.setBackground("#71717a");
    r.setFontColor("#ffffff");
    r.setFontFamily("Roboto");
    r.setFontWeight("bold");
    r.setFontSize(8);
    r.setHorizontalAlignment("center");
    r.setVerticalAlignment("middle");
  });
  
  // Apply borders for the entire header block (Rows 7, 8, 9)
  sheet.getRange("A7:AK9").setBorder(true, true, true, true, true, true, "#71717a", SpreadsheetApp.BorderStyle.SOLID);
  
  // 9. Habit rows and content (Rows 10 to 21)
  var defaultHabits = [
    "Wake up at 6:00 AM ⏰",
    "Cold Shower 🚿",
    "Plan the day 📝",
    "Work 💻",
    "No sugar 🧁",
    "No Alcohol 🍺",
    "Read 10 pages 📖",
    "Meditation 🧘",
    "Yoga 🧘‍♀️",
    "Social media less than 1H 📵",
    "Gym 🏋️‍♂️",
    "Talk with friends 🗣️"
  ];
  
  for (var i = 0; i < defaultHabits.length; i++) {
    var row = 10 + i;
    // Habit Name (Col A)
    var nameCell = sheet.getRange(row, 1);
    nameCell.setValue(defaultHabits[i]);
    nameCell.setBackground("#ffffff");
    nameCell.setFontColor("#18181b");
    nameCell.setFontFamily("Roboto");
    nameCell.setFontWeight("bold");
    nameCell.setFontSize(9);
    nameCell.setHorizontalAlignment("left");
    nameCell.setVerticalAlignment("middle");
    
    // Checkbox columns (Col B to AF)
    var checkboxRange = sheet.getRange(row, 2, 1, 31);
    checkboxRange.setBackground("#ffffff");
    checkboxRange.insertCheckboxes();
    checkboxRange.setHorizontalAlignment("center");
    checkboxRange.setVerticalAlignment("middle");
    
    // Analysis columns (Col AG to AK)
    sheet.getRange(row, 33).setFormula("=COUNT(B$9:AF$9)"); // GOAL
    sheet.getRange(row, 34).setFormula("=COUNTIF(B" + row + ":AF" + row + ", TRUE)"); // ACTUAL
    sheet.getRange(row, 35).setFormula("=AG" + row + "-AH" + row); // LEFT
    sheet.getRange(row, 36).setFormula('=SPARKLINE(AH' + row + ', {"charttype", "bar"; "max", AG' + row + '; "color1", "#71717a"})'); // PROGRESS (SPARKLINE)
    sheet.getRange(row, 37).setFormula("=AH" + row + "/AG" + row); // %
    
    // Style Analysis cells
    var analysisRowRange = sheet.getRange(row, 33, 1, 5);
    analysisRowRange.setBackground("#f4f4f5");
    analysisRowRange.setFontColor("#18181b");
    analysisRowRange.setFontFamily("Roboto");
    analysisRowRange.setFontWeight("bold");
    analysisRowRange.setFontSize(9);
    analysisRowRange.setHorizontalAlignment("center");
    analysisRowRange.setVerticalAlignment("middle");
    
    // Format percentage column
    sheet.getRange(row, 37).setNumberFormat("0.00%");
  }
  
  // Style and borders for habits grid
  sheet.getRange("A10:AK21").setBorder(true, true, true, true, true, true, "#a1a1aa", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("A10:A21").setBorder(null, null, null, true, null, null, "#71717a", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.getRange("AG10:AG21").setBorder(null, true, null, null, null, null, "#71717a", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // 10. Helper Row 22 (for daily progress % calculation, hidden)
  for (var c = 2; c <= 32; c++) {
    var colLetter = getColumnLetter(c);
    sheet.getRange(22, c).setFormula("=IF(" + colLetter + "$9=\"\", \"\", COUNTIF(" + colLetter + "$10:" + colLetter + "$21, TRUE) / COUNTA($A$10:$A$21))");
  }
  sheet.getRange("B22:AF22").setNumberFormat("0.0%");
  
  // 11. Mental State Section (Row 23 to 25)
  // Header Row 23 (A23:AF23)
  var mentalHeader = sheet.getRange("A23:AF23");
  mentalHeader.merge();
  mentalHeader.setValue("Mental State");
  mentalHeader.setBackground("#52525b");
  mentalHeader.setFontColor("#ffffff");
  mentalHeader.setFontFamily("Roboto");
  mentalHeader.setFontWeight("bold");
  mentalHeader.setFontSize(10);
  mentalHeader.setHorizontalAlignment("center");
  mentalHeader.setVerticalAlignment("middle");
  
  // Mood Row label A24:E24
  var moodLabel = sheet.getRange("A24:E24");
  moodLabel.merge();
  moodLabel.setValue("Mood");
  moodLabel.setBackground("#71717a");
  moodLabel.setFontColor("#ffffff");
  moodLabel.setFontFamily("Roboto");
  moodLabel.setFontWeight("bold");
  moodLabel.setFontSize(9);
  moodLabel.setHorizontalAlignment("center");
  moodLabel.setVerticalAlignment("middle");
  
  // Motivation Row label A25:E25
  var motivationLabel = sheet.getRange("A25:E25");
  motivationLabel.merge();
  motivationLabel.setValue("Motivation");
  motivationLabel.setBackground("#71717a");
  motivationLabel.setFontColor("#ffffff");
  motivationLabel.setFontFamily("Roboto");
  motivationLabel.setFontWeight("bold");
  motivationLabel.setFontSize(9);
  motivationLabel.setHorizontalAlignment("center");
  motivationLabel.setVerticalAlignment("middle");
  
  // Mock data for Mood and Motivation (Rows 24 and 25)
  var mockMood = [5, 4, 7, 8, 6, 5, 4, 8, 9, 5, 8, 7, 9, 5, 8, 7, 5, 6, 9, 8, 6, 6, 6, 8, 5, 8, 7, 9, 6, 8, 5];
  var mockMotiv = [4, 5, 6, 5, 4, 8, 9, 6, 4, 5, 1, 2, 3, 7, 4, 5, 6, 9, 8, 7, 4, 5, 6, 4, 8, 6, 5, 4, 5, 7, 5];
  
  for (var c = 2; c <= 32; c++) {
    var valMood = mockMood[c - 2];
    var valMotiv = mockMotiv[c - 2];
    sheet.getRange(24, c).setValue(valMood).setFontColor("#ec4899").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center").setVerticalAlignment("middle");
    sheet.getRange(25, c).setValue(valMotiv).setFontColor("#f59e0b").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center").setVerticalAlignment("middle");
  }
  
  // Borders and validations for Mood/Motivation
  sheet.getRange("A23:AF25").setBorder(true, true, true, true, true, true, "#71717a", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("A24:E25").setBorder(null, null, null, true, null, null, "#71717a", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  var validationRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(1, 10)
    .setAllowInvalid(false)
    .setHelpText("Please enter a value between 1 and 10.")
    .build();
  sheet.getRange("B24:AF25").setDataValidation(validationRule);
  
  // 12. Top 10 Leaderboard Section (AG23:AK33)
  // Header
  var leaderHeader = sheet.getRange("AG23:AK23");
  leaderHeader.merge();
  leaderHeader.setValue("TOP 10 DAILY HABITS");
  leaderHeader.setBackground("#52525b");
  leaderHeader.setFontColor("#ffffff");
  leaderHeader.setFontFamily("Roboto");
  leaderHeader.setFontWeight("bold");
  leaderHeader.setFontSize(10);
  leaderHeader.setHorizontalAlignment("center");
  leaderHeader.setVerticalAlignment("middle");
  
  // Populate Ranks and Formulas
  for (var rank = 1; rank <= 10; rank++) {
    var row = 23 + rank;
    // Rank Number (Col AG)
    var rankCell = sheet.getRange(row, 33);
    rankCell.setValue(rank);
    rankCell.setBackground("#f4f4f5");
    rankCell.setFontColor("#52525b");
    rankCell.setFontFamily("Roboto");
    rankCell.setFontWeight("bold");
    rankCell.setFontSize(9);
    rankCell.setHorizontalAlignment("center");
    rankCell.setVerticalAlignment("middle");
    
    // Leaderboard Item Name (Col AH:AK merged)
    var itemRange = sheet.getRange(row, 34, 1, 4);
    itemRange.merge();
    itemRange.setFormula("=IFERROR(INDEX(SORT($A$10:$A$21, $AH$10:$AH$21, FALSE), " + rank + "), \"\")");
    itemRange.setBackground("#ffffff");
    itemRange.setFontColor("#18181b");
    itemRange.setFontFamily("Roboto");
    itemRange.setFontWeight("bold");
    itemRange.setFontSize(9);
    itemRange.setHorizontalAlignment("center");
    itemRange.setVerticalAlignment("middle");
  }
  sheet.getRange("AG23:AK33").setBorder(true, true, true, true, true, true, "#71717a", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("AG24:AG33").setBorder(null, null, null, true, null, null, "#71717a", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // Fill in background colors around the tables to look like a solid dashboard container
  // A22:AK22 background
  sheet.getRange("A22:AK22").setBackground("#a1a1aa");
  // Fill Column AL and AM hidden columns for charts reference, but first write helper values
  
  // 13. Populate Helper Tables (AL1:AM32)
  // Overall Stats helper table:
  sheet.getRange("AL1").setValue("Status");
  sheet.getRange("AM1").setValue("Count");
  sheet.getRange("AL2").setValue("Completed");
  sheet.getRange("AM2").setValue("=AB4");
  sheet.getRange("AL3").setValue("Left");
  sheet.getRange("AM3").setValue("=AB6");
  
  // Weekly Progress helper table:
  sheet.getRange("AL5").setValue("Week");
  sheet.getRange("AM5").setValue("Progress");
  sheet.getRange("AL6").setValue("Week 1");
  sheet.getRange("AM6").setFormula("=COUNTIF(B$10:H$21, TRUE) / (COUNT(B$9:H$9) * COUNTA($A$10:$A$21))");
  sheet.getRange("AL7").setValue("Week 2");
  sheet.getRange("AM7").setFormula("=COUNTIF(I$10:O$21, TRUE) / (COUNT(I$9:O$9) * COUNTA($A$10:$A$21))");
  sheet.getRange("AL8").setValue("Week 3");
  sheet.getRange("AM8").setFormula("=COUNTIF(P$10:V$21, TRUE) / (COUNT(P$9:V$9) * COUNTA($A$10:$A$21))");
  sheet.getRange("AL9").setValue("Week 4");
  sheet.getRange("AM9").setFormula("=COUNTIF(W$10:AC$21, TRUE) / (COUNT(W$9:AC$9) * COUNTA($A$10:$A$21))");
  sheet.getRange("AL10").setValue("Week 5");
  sheet.getRange("AM10").setFormula("=IF(COUNT(AD$9:AF$9)=0, 0, COUNTIF(AD$10:AF$21, TRUE) / (COUNT(AD$9:AF$9) * COUNTA($A$10:$A$21)))");
  
  // Daily Progress helper table (AN1:AO32):
  sheet.getRange("AN1").setValue("Day");
  sheet.getRange("AO1").setValue("Progress");
  // Mental State helper table (AQ1:AS32):
  sheet.getRange("AQ1").setValue("Day");
  sheet.getRange("AR1").setValue("Mood");
  sheet.getRange("AS1").setValue("Motivation");
  
  for (var d = 1; d <= 31; d++) {
    var colLetter = getColumnLetter(d + 1);
    // Daily progress
    sheet.getRange(d + 1, 40).setFormula("=" + colLetter + "9"); // AN
    sheet.getRange(d + 1, 41).setFormula("=" + colLetter + "22"); // AO
    // Mental State
    sheet.getRange(d + 1, 43).setFormula("=" + colLetter + "9"); // AQ
    sheet.getRange(d + 1, 44).setFormula("=" + colLetter + "24"); // AR
    sheet.getRange(d + 1, 45).setFormula("=" + colLetter + "25"); // AS
  }
  
  // 14. Hide helper row and columns
  sheet.hideRows(22);
  sheet.hideColumns(38, 8); // Hide Columns AL (38) to AS (45)
  
  // 15. Create Conditional Formatting Rules
  var rules = [];
  
  // Rule 1: Gray out and disable empty day checkboxes (when Row 9 is blank)
  // Target B10:AF21
  var checkboxRangeCF = sheet.getRange("B10:AF21");
  var ruleEmptyDays = SpreadsheetApp.newConditionalFormattingRule()
      .whenFormulaSatisfied("=B$9=\"\"")
      .setFontColor("#e4e4e7")
      .setBackground("#e4e4e7")
      .setRanges([checkboxRangeCF])
      .build();
  rules.push(ruleEmptyDays);
  
  // Rule 2: Weekend columns background highlight (#f4f4f5)
  // Target B10:AF21
  var ruleWeekendsBody = SpreadsheetApp.newConditionalFormattingRule()
      .whenFormulaSatisfied("=OR(TEXT(B$9, \"ddd\")=\"Sat\", TEXT(B$9, \"ddd\")=\"Sun\")")
      .setBackground("#f4f4f5")
      .setRanges([checkboxRangeCF])
      .build();
  rules.push(ruleWeekendsBody);
  
  // Target B8:AF9 (Headers weekend highlight #52525b)
  var ruleWeekendsHeader = SpreadsheetApp.newConditionalFormattingRule()
      .whenFormulaSatisfied("=OR(TEXT(B$9, \"ddd\")=\"Sat\", TEXT(B$9, \"ddd\")=\"Sun\")")
      .setBackground("#52525b")
      .setFontColor("#ffffff")
      .setRanges([daysHeaderRange])
      .build();
  rules.push(ruleWeekendsHeader);
  
  sheet.setConditionalFormatRules(rules);
  
  // 16. Build and Insert Charts
  
  // A. Daily Progress Chart (placed in F1 over F1:U6)
  var dailyChart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(sheet.getRange("AN1:AO32"))
      .setPosition(1, 6, 5, 5)
      .setOption("title", "Daily Progress")
      .setOption("legend", {position: "none"})
      .setOption("vAxis", {minValue: 0, maxValue: 1, format: "0%", gridlines: {count: 5}, textStyle: {fontSize: 8}})
      .setOption("hAxis", {gridlines: {count: 0}, textStyle: {fontSize: 7}})
      .setOption("colors", ["#71717a"])
      .setOption("showHiddenData", true)
      .setOption("chartArea", {left: 45, top: 30, width: "88%", height: "70%"})
      .setWidth(405)
      .setHeight(132)
      .build();
  sheet.insertChart(dailyChart);
  
  // B. Weekly Progress Chart (placed in V1 over V1:AA6)
  var weeklyChart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(sheet.getRange("AL5:AM10"))
      .setPosition(1, 22, 5, 5)
      .setOption("title", "Weekly Progress")
      .setOption("legend", {position: "none"})
      .setOption("vAxis", {minValue: 0, maxValue: 1, format: "0%", gridlines: {count: 5}, textStyle: {fontSize: 8}})
      .setOption("hAxis", {textStyle: {fontSize: 8}})
      .setOption("colors", ["#71717a"])
      .setOption("showHiddenData", true)
      .setOption("chartArea", {left: 35, top: 30, width: "75%", height: "70%"})
      .setWidth(148)
      .setHeight(132)
      .build();
  sheet.insertChart(weeklyChart);
  
  // C. Overall Stats Donut Chart (placed in AD1 over AD1:AK6)
  var donutChart = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(sheet.getRange("AL1:AM3"))
      .setPosition(1, 30, 5, 5)
      .setOption("title", "OVERALL STATS")
      .setOption("pieHole", 0.6)
      .setOption("colors", ["#71717a", "#d4d4d8"])
      .setOption("legend", {position: "right", textStyle: {fontSize: 8}})
      .setOption("showHiddenData", true)
      .setOption("chartArea", {left: 15, top: 35, width: "90%", height: "75%"})
      .setWidth(360)
      .setHeight(132)
      .build();
  sheet.insertChart(donutChart);
  
  // D. Mental State Area Chart (placed in A26 over A26:AF35)
  var mentalChart = sheet.newChart()
      .setChartType(Charts.ChartType.AREA)
      .addRange(sheet.getRange("AQ1:AS32"))
      .setPosition(26, 1, 5, 5)
      .setOption("title", "Mood & Motivation Trends")
      .setOption("vAxis", {minValue: 0, maxValue: 10, gridlines: {count: 6}, textStyle: {fontSize: 8}})
      .setOption("colors", ["#ec4899", "#f59e0b"])
      .setOption("tension", 0.4)
      .setOption("showHiddenData", true)
      .setOption("chartArea", {left: 45, top: 30, width: "92%", height: "70%"})
      .setWidth(976)
      .setHeight(192)
      .build();
  sheet.insertChart(mentalChart);
  
  SpreadsheetApp.getActiveSpreadsheet().toast("Habit Tracker setup completed successfully!", "Success", 5);
}

function getColumnLetter(col) {
  var temp, letter = "";
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}

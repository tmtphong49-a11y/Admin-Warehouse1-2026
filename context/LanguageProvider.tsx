
import React, { createContext, useState, useEffect, useContext, ReactNode, FC } from 'react';

const translations = {
    en: {
        'kpiReport': 'KPI Report', 'consumablesReport': 'Consumables Report', 'otReport': 'OT Report', 'leaveReport': 'Leave Report', 'accidentReport': 'Accident Report', 'workloadReport': 'Workload Report', 'manpowerReport': 'Manpower Report', 'warningLetterReport': 'Warning Letter', 'purchaseRequestReport': 'Purchase Request Report', 'reports': 'Reports', 'documents': 'Documents', 'settings': 'Settings', 'helpCenter': 'Help Center', 'analytics': 'Admin-WH1 Report', 'search': 'Search...', 'uploadKpiData': 'Upload KPI Data', 'shareReport': 'Share Report', 'loadReport': 'Load Report', 'userName': 'Jane Doe', 'userRole': 'Admin', 'vsLastMonth': 'vs last month', 'kpiProgressOverview': 'KPI Progress Overview', 'kpiDetails': 'KPI Details', 'searchDetails': 'Search details...', 'kpi': 'KPI', 'target': 'Target', 'score': 'Score', 'result': 'Result', 'noResultsFound': 'No results found.', 'uploadExcel': 'Upload Excel', 'noDataLoaded': 'No Data Loaded', 'noDataLoadedMessageConsumables': 'Please upload an Excel file using the button above to view the report.', 'monthlyConsumablesCost': 'Monthly Consumables Cost', 'top10FrequentItems': 'Top 10 Items by Cost', 'frequency': 'Frequency', 'totalCost': 'Total Cost', 'costByDepartment': 'Cost by Department', 'department': 'Department', 'recentTransactions': 'Recent Transactions', 'searchTransactions': 'Search transactions...', 'noDataLoadedMessageOT': 'Please upload an Excel file using the button above to view the OT report.', 'monthlyOvertimeHours': 'Monthly Overtime Hours', 'top10EmployeesByOT': 'Top 10 Employees by OT', 'name': 'Name', 'totalHours': 'Total Hours', 'top10DepartmentsByOT': 'Top 10 Departments by OT', 'employeeOTDetails': 'Employee OT Details', 'searchEmployees': 'Search employees...', 'noDataLoadedMessageLeave': 'Please upload an Excel file using the button above to view the Leave report.', 'monthlyLeaveDays': 'Monthly Leave Days', 'top10LeaveEmployees': 'Top 10 Employees by Leave', 'days': 'Days', 'top5LeaveTypes': 'Top 5 Leave Types', 'leaveType': 'Leave Type', 'top5LeaveDepartments': '5 Departments by Leave', 'employeeLeaveDetails': 'Employee Leave Details', 'noDataLoadedMessageAccident': 'Please upload an Excel file using the button above to view the Accident report.', 'noDataLoadedMessageKpi': 'Please upload an Excel file using the button above to view the KPI report.', 'noDataLoadedMessageWorkload': 'Please upload an Excel file using the button above to view the Workload report.', 'accidentsByDepartment': 'Accidents by Department', 'accidentDetails': 'Accident Details', 'searchAccidents': 'Search accidents...', 'workloadByProduct': 'Workload by Product (Ton/Person/Hr.)', 'avgWorkloadRaw': 'Avg. Ton/Hr (SSRM)', 'avgWorkloadCoil': 'Avg. Ton/Hr (COIL)', 'avgWorkloadFilm': 'Avg. Ton/Hr (FILM)', 'workloadDetails': 'Workload Details', 'product': 'Product', 'description': 'Description', 'unit': 'Unit', 'underConstruction': 'This page is under construction.', 'pass': 'PASS', 'inProgress': 'In Progress',
        'vsLastYear': 'vs last year', 'comparisonReport': 'Comparison',
        'targetModal': 'Target', 'scoreModal': 'Score', 'resultModal': 'Result', 'monthlyData': 'Monthly Data', 'descriptionModal': 'Description', 'objective': 'Objective', 'measurementMethod': 'Measurement Method', 'responsible': 'Responsible', 'improvementPlan': 'Improvement Plan', 'close': 'Close',
        'headerDate': 'Date', 'headerMaterial': 'Material', 'headerDescription': 'Description', 'headerQuantity': 'Quantity', 'headerUnit': 'Unit', 'headerPrice': 'Price', 'headerTotalPrice': 'Total Price', 'headerCostCenter': 'Cost Center', 'headerDepartment': 'Department', 'subtotal': 'Subtotal',
        'headerId': 'ID', 'headerEmployeeId': 'Employee ID', 'headerName': 'Name', 'headerPosition': 'Position', 'headerGrade': 'Grade', 'headerStatus': 'Status', 'headerTotal': 'Total', 'departmentLabel': 'Department',
        'monthJan': 'Jan', 'monthFeb': 'Feb', 'monthMar': 'Mar', 'monthApr': 'Apr', 'monthMay': 'May', 'monthJun': 'Jun', 'monthJul': 'Jul', 'monthAug': 'Aug', 'monthSep': 'Sep', 'monthOct': 'Oct', 'monthNov': 'Nov', 'monthDec': 'Dec',
        'headerNo': 'NO.', 'headerEmp': 'EMP.', 'headerNameSurname': 'NAME-SURNAME', 'headerDept': 'DEPT.', 'headerLeaveNoVac': 'Leave (No Vac)', 'headerLeaveWithVac': 'Leave (w/ Vac)', 'headerVacCarried': 'Vac Carried', 'headerVacEntitled': 'Vac Entitled', 'headerTotalVac': 'Total Vac', 'headerVacUsed': 'Vac Used', 'headerVacAccrued': 'Vac Accrued', 'headerSick': 'Sick', 'headerPersonal': 'Personal', 'headerBirthday': 'Birthday', 'headerOther': 'Other', 'leaveTypeVacation': 'Vacation', 'leaveTypeSick': 'Sick Leave', 'leaveTypePersonal': 'Personal Leave', 'leaveTypeBirthday': 'Birthday Leave', 'leaveTypeOther': 'Other Leave',
        'severityBreakdown': 'Severity Breakdown', 'noSeverityData': 'No severity data', 'headerSeq': 'No.', 'headerIncidentDate': 'Incident Date', 'headerIncidentTime': 'Time', 'headerSeverity': 'Severity', 'headerOccurrence': 'Occurrence', 'headerWorkSection': 'Section', 'headerDetails': 'Details', 'headerCause': 'Cause', 'headerPrevention': 'Prevention', 'headerDamageValue': 'Damage Value', 'headerInsuranceClaim': 'Claim', 'headerActionTaken': 'Action Taken', 'headerPenalty': 'Penalty', 'headerRemarks': 'Remarks', 'headerLocation': 'Location',
        'chartRawMaterial': 'SSRM', 'chartCoil': 'COIL', 'chartFilmScrap': 'FILM', 'headerAverage': 'AVERAGE', 'headerMin': 'MIN', 'headerMax': 'MAX',
        'totalIncidents': 'Total Incidents', 'totalDamage': 'Total Damage', 'topDepartmentAccident': 'Top Department', 'topSeverity': 'Top Severity',
        'totalOtHours': 'Total OT Hours', 'totalEmployeesOt': 'Total Employees', 'topDepartmentOt': 'Top Department',
        'topMonthOt': 'Top Month', 'totalLeaveDays': 'Total Leave Days', 'topLeaveType': 'Top Leave Type',
        'topDepartmentLeave': 'Top Department', 'topMonthLeave': 'Top Month', 'kpiTotalCost': 'Total Cost',
        'kpiTransactions': 'Transactions', 'kpiTotalItems': 'Total Items', 'kpiDepartments': 'Departments',
        'employees': 'Employees',
        'leaveDetailsModalTitle': 'Leave Breakdown',
        'leaveSummaryNote': 'This is a summary of leave days by type. Specific dates are not available in this view.',
        'leaveTypeDetailsModalTitle': 'Details by Department',
        'departmentLeaveDetailsModalTitle': 'Leave Details by Type',
        'topItemDetailsModalTitle': 'Item Details by Department',
        'noLeave6MonthsTitle': 'Employees with No Leave (Last 6 Months)',
        'damageByDepartment': 'Damage by Department',
        'severityByDepartment': 'Severity by Department',
        'case': 'Case',
        'cases': 'Cases',
        'time_unit': 'time',
        'times_unit': 'times',
        'accidentWh1Report': 'Accident WH1 Report',
        'noDataLoadedMessageAccidentWh1': 'Please upload an Excel file using the button above to view the Accident WH1 report.',
        'noDataLoadedMessageWarningLetter': 'Please upload an Excel file using the button above to view the Warning Letter report.',
        'noDataLoadedMessagePurchaseRequest': 'Please upload an Excel file using the button above to view the Purchase Request report.',
        'totalOtPay': 'Total OT Pay',
        'otRate': 'OT Rate (hr)',
        'year': 'Year',
        'monthlyOvertimePay': 'Monthly OT Pay',
        'monthlyOvertimeHoursAndPay': 'Monthly OT Hours & Pay',
        'noDataLoadedMessageManpower': 'Please upload the Manpower Excel file to view the report.',
        'employeeStatusBreakdown': 'Manpower vs. Current Headcount',
        'headcountByDepartment': 'Headcount by Department',
        'employeeDetails': 'Employee Details',
        'totalEmployees': 'Current Employees',
        'permanentEmployees': 'Permanent Staff',
        'additionalManpowerNeeded': 'Additional Staff Needed',
        'totalDepartments': 'Total Departments',
        'manpowerVsCurrentByDept': 'Manpower vs. Current Headcount by Department',
        'totalWarnings': 'Total Warnings',
        'verbalWarnings': 'Verbal Warnings',
        'writtenWarnings': 'Written Warnings',
        'warningsByDepartment': 'Warnings by Department',
        'warningTypeBreakdown': 'Warning Type Breakdown',
        'manpowerTotal': 'Total Manpower',
        'currentTotal': 'Current Headcount',
        'neededStaffByDepartment': 'Needed Staff by Department',
        'positionsNeeded': 'Positions Needed',
        'top10SickLeaveEmployees': 'Top 10 Employees by Sick Leave',
        'top10PersonalLeaveEmployees': 'Top 10 Employees by Personal Leave',
        'trainingReport': 'Training Report',
        'turnoverReport': 'Employee In–Out Report', 'totalTurnover': 'Total Turnover', 'avgTenure': 'Average Tenure (Years)', 'topReasonForLeaving': 'Top Reason for Leaving', 'topDeptByTurnover': 'Top Dept. by Turnover', 'monthlyTurnover': 'Monthly Turnover', 'turnoverByReason': 'Turnover by Reason', 'turnoverByDept': 'Turnover by Department', 'turnoverDetails': 'Turnover Details', 'searchTurnover': 'Search by name, dept, reason...', 'headerHireDate': 'Hire Date', 'headerTerminationDate': 'Termination Date', 'headerReasonType': 'Reason Type', 'headerReasonDetail': 'Reason Detail', 'headerTenure': 'Tenure (Yrs)',
        'newHiresByMonth': 'New Hires by Month',
        'resignationsByMonth': 'Resignations by Month',
        'turnoverByDepartmentChart': 'Hires & Resignations by Department',
        'legendNewHires': 'New Hires',
        'legendResignations': 'Resignations',
        'employeeDetailsModalTitle': 'Employee Details',
        'tenure': 'Tenure',
        'personalInfo': 'Personal Information',
        'employmentInfo': 'Employment Information',
        'terminationInfo': 'Termination Information',
        'hireDateBuddhist': 'Hire Date (B.E.)',
        'hireDateChristian': 'Hire Date (A.D.)',
        'tenureYears': 'Tenure (Years)',
        'tenureMonths': 'Tenure (Months)',
        'tenureDays': 'Tenure (Days)',
        'probationPassDate': 'Probation Pass Date',
        'nickname': 'Nickname',
        'dob': 'Date of Birth',
        'age': 'Age',
        'religion': 'Religion',
        'mobile': 'Mobile',
        'hometown': 'Hometown',
        'education': 'Education',
        'employmentType': 'Employment Type',
        'effectiveDate': 'Effective Date',
        'reasonForLeaving': 'Reason for Leaving',
        'turnoverStatusBreakdown': 'Hires vs. Resignations',
        'legendNewHires2025': 'New Hires',
        'averageOtReport': 'Average OT Report',
        'headerEmployeeCount': '# Employees',
        'headerTotalOtHours': 'Total OT Hours',
        'headerAvgOtMonth': 'Avg OT/Month',
        'headerAvgOtWeek': 'Avg OT/Week',
        'totalRequests': 'Total Requests', 'totalApprovedValue': 'Total Approved Value', 'pendingRequests': 'Pending Requests', 'topDeptByValue': 'Top Dept by Value',
        'monthlyPurchaseValue': 'Monthly Purchase Value', 'costByDepartmentPR': 'Cost by Department',
        'purchaseStatusBreakdown': 'Purchase Status Breakdown',
    },
    th: {
        'kpiReport': 'รายงาน KPI', 'consumablesReport': 'วัสดุสิ้นเปลือง', 'otReport': 'รายงาน OT', 'leaveReport': 'รายงานการลา', 'accidentReport': 'รายงานอุบัติเหตุ', 'workloadReport': 'ปริมาณการทำงานต่อคน', 'manpowerReport': 'รายงานกำลังคน', 'warningLetterReport': 'ใบเตือน', 'purchaseRequestReport': 'รายงานการขอซื้อ', 'reports': 'รายงานอื่นๆ', 'documents': 'เอกสาร', 'settings': 'ตั้งค่า', 'helpCenter': 'ศูนย์ช่วยเหลือ', 'analytics': 'รายงานAdmin-WH1', 'search': 'ค้นหา...', 'uploadKpiData': 'อัปโหลดข้อมูล KPI', 'shareReport': 'แชร์รายงาน', 'loadReport': 'โหลดรายงาน', 'userName': 'เจน โด', 'userRole': 'ผู้ดูแลระบบ', 'vsLastMonth': 'เทียบกับเดือนที่แล้ว', 'kpiProgressOverview': 'ภาพรวมความคืบหน้า KPI', 'kpiDetails': 'รายละเอียด KPI', 'searchDetails': 'ค้นหารายละเอียด...', 'kpi': 'KPI', 'target': 'เป้าหมาย', 'score': 'คะแนน', 'result': 'ผลลัพธ์', 'noResultsFound': 'ไม่พบผลลัพธ์', 'uploadExcel': 'อัปโหลด Excel', 'noDataLoaded': 'ไม่มีข้อมูล', 'noDataLoadedMessageConsumables': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงาน', 'monthlyConsumablesCost': 'ค่าใช้จ่ายวัสดุสิ้นเปลืองรายเดือน', 'top10FrequentItems': '10 อันดับรายการที่มูลค่าที่เบิกสูงที่สุด', 'frequency': 'ความถี่', 'totalCost': 'ต้นทุนรวม', 'costByDepartment': 'ค่าใช้จ่ายตามส่วนงาน', 'department': 'แผนก', 'recentTransactions': 'ธุรกรรมล่าสุด', 'searchTransactions': 'ค้นหาธุรกรรม...', 'noDataLoadedMessageOT': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงาน OT', 'monthlyOvertimeHours': 'ชั่วโมงล่วงเวลาแต่ละเดือน', 'top10EmployeesByOT': '10 อันดับพนักงานที่ทำ OT สูงสุด', 'name': 'ชื่อ', 'totalHours': 'ชั่วโมงรวม', 'top10DepartmentsByOT': 'อันดับส่วนงานที่ทำ OT สูงสุด', 'employeeOTDetails': 'รายละเอียด OT ของพนักงาน', 'searchEmployees': 'ค้นหาพนักงาน...', 'noDataLoadedMessageLeave': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงานการลา', 'monthlyLeaveDays': 'จำนวนวันลาแต่ละเดือน', 'top10LeaveEmployees': '10 อันดับพนักงานที่ลามากที่สุด', 'days': 'วัน', 'top5LeaveTypes': '5 อันดับประเภทการลา', 'leaveType': 'ประเภทการลา', 'top5LeaveDepartments': '5 อันดับส่วนงานที่ลามากที่สุด', 'employeeLeaveDetails': 'รายละเอียดการลาของพนักงาน', 'noDataLoadedMessageAccident': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงานอุบัติเหตุ', 'noDataLoadedMessageKpi': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงาน KPI', 'noDataLoadedMessageWorkload': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงานปริมาณงาน', 'accidentsByDepartment': 'อุบัติเหตุตามส่วนงาน', 'accidentDetails': 'รายละเอียดอุบัติเหตุ', 'searchAccidents': 'ค้นหาอุบัติเหตุ...', 'workloadByProduct': 'ปริมาณงานตามผลิตภัณฑ์ (ตัน/คน/ชม.)', 'avgWorkloadRaw': 'เฉลี่ย Ton/Hr (SSRM)', 'avgWorkloadCoil': 'เฉลี่ย Ton/Hr (COIL)', 'avgWorkloadFilm': 'เฉลี่ย Ton/Hr (FILM)', 'workloadDetails': 'รายละเอียดปริมาณงาน', 'product': 'ผลิตภัณฑ์', 'description': 'คำอธิบาย', 'unit': 'หน่วย', 'underConstruction': 'หน้านี้กำลังอยู่ระหว่างการพัฒนา', 'pass': 'ผ่าน', 'inProgress': 'ดำเนินการอยู่',
        'vsLastYear': 'เทียบกับปีที่แล้ว', 'comparisonReport': 'เปรียบเทียบ',
        'targetModal': 'เป้าหมาย', 'scoreModal': 'คะแนน', 'resultModal': 'ผลลัพธ์', 'monthlyData': 'ข้อมูลรายเดือน', 'descriptionModal': 'คำอธิบาย', 'objective': 'วัตถุประสงค์', 'measurementMethod': 'วิธีการวัด', 'responsible': 'ผู้รับผิดชอบ', 'improvementPlan': 'แผนการปรับปรุง', 'close': 'ปิด',
        'headerDate': 'วันที่', 'headerMaterial': 'วัสดุ', 'headerDescription': 'คำอธิบาย', 'headerQuantity': 'จำนวน', 'headerUnit': 'หน่วย', 'headerPrice': 'ราคา', 'headerTotalPrice': 'ราคารวม', 'headerCostCenter': 'Cost Center', 'headerDepartment': 'แผนก', 'subtotal': 'ยอดรวมย่อย',
        'headerId': 'ID', 'headerEmployeeId': 'รหัสพนักงาน', 'headerName': 'ชื่อ', 'headerPosition': 'ตำแหน่ง', 'headerGrade': 'ระดับ', 'headerStatus': 'สถานะ', 'headerTotal': 'รวม', 'departmentLabel': 'แผนก',
        'monthJan': 'ม.ค.', 'monthFeb': 'ก.พ.', 'monthMar': 'มี.ค.', 'monthApr': 'เม.ย.', 'monthMay': 'พ.ค.', 'monthJun': 'มิ.ย.', 'monthJul': 'ก.ค.', 'monthAug': 'ส.ค.', 'monthSep': 'ก.ย.', 'monthOct': 'ต.ค.', 'monthNov': 'พ.ย.', 'monthDec': 'ธ.ค.',
        'headerNo': 'ลำดับ', 'headerEmp': 'รหัส', 'headerNameSurname': 'ชื่อ-สกุล', 'headerDept': 'แผนก', 'headerLeaveNoVac': 'ลา (ไม่รวมพักร้อน)', 'headerLeaveWithVac': 'ลา (รวมพักร้อน)', 'headerVacCarried': 'พักร้อนยกมา', 'headerVacEntitled': 'สิทธิพักร้อน', 'headerTotalVac': 'รวมพักร้อน', 'headerVacUsed': 'ใช้พักร้อน', 'headerVacAccrued': 'พักร้อนสะสม', 'headerSick': 'ลาป่วย', 'headerPersonal': 'ลากิจ', 'headerBirthday': 'วันเกิด', 'headerOther': 'อื่นๆ', 'leaveTypeVacation': 'ลาพักร้อน', 'leaveTypeSick': 'ลาป่วย', 'leaveTypePersonal': 'ลากิจ', 'leaveTypeBirthday': 'ลาวันเกิด', 'leaveTypeOther': 'ลาอื่นๆ',
        'severityBreakdown': 'เคสตามความรุนแรง', 'noSeverityData': 'ไม่มีข้อมูลความรุนแรง', 'headerSeq': 'ลำดับ', 'headerIncidentDate': 'วันที่เกิดเหตุ', 'headerIncidentTime': 'เวลา', 'headerSeverity': 'ความรุนแรง', 'headerOccurrence': 'ครั้งที่', 'headerWorkSection': 'ส่วนงาน', 'headerDetails': 'รายละเอียด', 'headerCause': 'สาเหตุ', 'headerPrevention': 'มาตรการป้องกัน', 'headerDamageValue': 'มูลค่าความเสียหาย', 'headerInsuranceClaim': 'การเคลม', 'headerActionTaken': 'การดำเนินการ', 'headerPenalty': 'บทลงโทษ', 'headerRemarks': 'หมายเหตุ', 'headerLocation': 'สถานที่',
        'chartRawMaterial': 'SSRM', 'chartCoil': 'COIL', 'chartFilmScrap': 'FILM', 'headerAverage': 'เฉลี่ย', 'headerMin': 'ต่ำสุด', 'headerMax': 'สูงสุด',
        'totalIncidents': 'อุบัติเหตุทั้งหมด', 'totalDamage': 'ความเสียหายทั้งหมด', 'topDepartmentAccident': 'แผนกเกิดเหตุสูงสุด', 'topSeverity': 'ความรุนแรงสูงสุด',
        'totalOtHours': 'ชั่วโมง OT ทั้งหมด', 'totalEmployeesOt': 'พนักงานทั้งหมด', 'topDepartmentOt': 'ส่วนงานที่ทำ OT สูงสุด',
        'topMonthOt': 'เดือน OT สูงสุด', 'totalLeaveDays': 'วันลาทั้งหมด', 'topLeaveType': 'ประเภทการลาสูงสุด',
        'topDepartmentLeave': 'ส่วนงานที่ลาสูงสุด', 'topMonthLeave': 'เดือนที่ลาสูงสุด', 'kpiTotalCost': 'ค่าใช้จ่ายทั้งหมด',
        'kpiTransactions': 'จำนวนธุรกรรม', 'kpiTotalItems': 'จำนวนรายการ', 'kpiDepartments': 'จำนวนส่วนงาน',
        'employees': 'พนักงาน',
        'leaveDetailsModalTitle': 'รายละเอียดการลา',
        'leaveSummaryNote': 'นี่คือสรุปจำนวนวันลาตามประเภท ไม่สามารถดูวันที่เจาะจงได้จากมุมมองนี้',
        'leaveTypeDetailsModalTitle': 'รายละเอียดตามแผนก',
        'departmentLeaveDetailsModalTitle': 'รายละเอียดการลาตามประเภท',
        'topItemDetailsModalTitle': 'รายละเอียดรายการตามแผนก',
        'noLeave6MonthsTitle': 'พนักงานที่ไม่มีประวัติการลา (6 เดือนล่าสุด)',
        'damageByDepartment': 'มูลค่าความเสียหายตามส่วนงาน',
        'severityByDepartment': 'ความรุนแรงตามส่วนงาน',
        'case': 'เคส',
        'cases': 'เคส',
        'time_unit': 'ครั้ง',
        'times_unit': 'ครั้ง',
        'accidentWh1Report': 'รายงานอุบัติเหตุ WH1',
        'noDataLoadedMessageAccidentWh1': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงานอุบัติเหตุ WH1',
        'noDataLoadedMessageWarningLetter': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงานใบเตือน',
        'noDataLoadedMessagePurchaseRequest': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงานการขอซื้อ',
        'totalOtPay': 'ค่าล่วงเวลาทั้งหมด',
        'otRate': 'อัตราโอที (ชม.)',
        'year': 'ปี',
        'monthlyOvertimePay': 'ค่าล่วงเวลารายเดือน',
        'monthlyOvertimeHoursAndPay': 'ชั่วโมงและค่าล่วงเวลารายเดือน',
        'noDataLoadedMessageManpower': 'กรุณาอัปโหลดไฟล์ Excel Manpower เพื่อดูรายงาน',
        'employeeStatusBreakdown': 'พนักงานตามโครงสร้าง : พนักงานปัจจุบัน',
        'headcountByDepartment': 'จำนวนพนักงานตามส่วนงาน',
        'employeeDetails': 'รายละเอียดพนักงาน',
        'totalEmployees': 'พนักงานปัจจุบัน',
        'permanentEmployees': 'พนักงานประจำ',
        'additionalManpowerNeeded': 'ต้องการพนักงานเพิ่ม',
        'totalDepartments': 'จำนวนส่วนงาน',
        'manpowerVsCurrentByDept': 'เปรียบเทียบกำลังคน (Manpower vs. Current) ตามแผนก',
        'totalWarnings': 'ใบเตือนทั้งหมด',
        'verbalWarnings': 'ใบเตือนวาจา',
        'writtenWarnings': 'ใบเตือนลายลักษณ์อักษร',
        'warningsByDepartment': 'จำนวนใบเตือนตามส่วนงาน',
        'warningTypeBreakdown': 'สัดส่วนประเภทใบเตือน',
        'manpowerTotal': 'กำลังคนตามโครงสร้าง',
        'currentTotal': 'พนักงานปัจจุบัน',
        'neededStaffByDepartment': 'จำนวนพนักงานที่ต้องการเพิ่มตามส่วนงาน',
        'positionsNeeded': 'ตำแหน่งที่ต้องการ',
        'top10SickLeaveEmployees': '10 อันดับที่ลาป่วยรวมสูงสุด',
        'top10PersonalLeaveEmployees': '10 อันดับที่ลากิจรวมสูงสุด',
        'trainingReport': 'รายงานการฝึกอบรม',
        'turnoverReport': 'รายงานพนักงานเข้า-ออก', 'totalTurnover': 'พนักงานที่ลาออกทั้งหมด', 'avgTenure': 'อายุงานเฉลี่ย (ปี)', 'topReasonForLeaving': 'สาเหตุการลาออกสูงสุด', 'topDeptByTurnover': 'แผนกที่ลาออกสูงสุด', 'monthlyTurnover': 'การลาออกรายเดือน', 'turnoverByReason': 'การลาออกตามเหตุผล', 'turnoverByDept': 'การลาออกตามแผนก', 'turnoverDetails': 'รายละเอียดการลาออก', 'searchTurnover': 'ค้นหาด้วยชื่อ, แผนก, เหตุผล...', 'headerHireDate': 'วันที่เริ่มงาน', 'headerTerminationDate': 'วันที่ลาออก', 'headerReasonType': 'ประเภทการลาออก', 'headerReasonDetail': 'รายละเอียดเหตุผล', 'headerTenure': 'อายุงาน (ปี)',
        'newHiresByMonth': 'จำนวนพนักงานเริ่มงานใหม่',
        'resignationsByMonth': 'จำนวนพนักงานลาออก',
        'turnoverByDepartmentChart': 'พนักงานเข้า-ออกตามแผนก',
        'legendNewHires': 'พนักงานเข้าใหม่',
        'legendResignations': 'จำนวนพนักงานลาออก',
        'employeeDetailsModalTitle': 'รายละเอียดพนักงาน',
        'tenure': 'อายุงาน',
        'personalInfo': 'ข้อมูลส่วนตัว',
        'employmentInfo': 'ข้อมูลการจ้างงาน',
        'terminationInfo': 'ข้อมูลการลาออก',
        'hireDateBuddhist': 'วันเริ่มงาน (พ.ศ.)',
        'hireDateChristian': 'วันเริ่มงาน (ค.ศ.)',
        'tenureYears': 'อายุงาน (ปี)',
        'tenureMonths': 'อายุงาน (เดือน)',
        'tenureDays': 'อายุงาน (วัน)',
        'probationPassDate': 'วันที่ผ่านทดลองงาน',
        'nickname': 'ชื่อเล่น',
        'dob': 'วันเกิด',
        'age': 'อายุ',
        'religion': 'ศาสนา',
        'mobile': 'โทรศัพท์',
        'hometown': 'ภูมิลำเนา',
        'education': 'วุฒิการศึกษา',
        'employmentType': 'สถานะการจ้างงาน',
        'effectiveDate': 'วันที่มีผล',
        'reasonForLeaving': 'สาเหตุการลาออก',
        'turnoverStatusBreakdown': 'สัดส่วนพนักงานเข้า-ออก',
        'legendNewHires2025': 'จำนวนพนักงานเข้าใหม่',
        'averageOtReport': 'รายงานเฉลี่ยโอที',
        'headerEmployeeCount': 'จำนวนพนักงาน',
        'headerTotalOtHours': 'จำนวน ชม.โอทีทั้งหมด',
        'headerAvgOtMonth': 'เฉลี่ย ชม.โอที/เดือน',
        'headerAvgOtWeek': 'เฉลี่ย ชม.โอที/สัปดาห์',
        'totalRequests': 'คำขอทั้งหมด', 'totalApprovedValue': 'มูลค่าอนุมัติรวม', 'pendingRequests': 'คำขอรอดำเนินการ', 'topDeptByValue': 'แผนกมูลค่าสูงสุด',
        'monthlyPurchaseValue': 'ยอดขอซื้อรายเดือน', 'costByDepartmentPR': 'ค่าใช้จ่ายตามส่วนงาน',
        'purchaseStatusBreakdown': 'สัดส่วนสถานะการขอซื้อ',
    }
};

type Language = 'en' | 'th';
type Translations = typeof translations.en;

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (key: keyof Translations) => string;
}

const getInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue) as T;
        }
    } catch (error) {
        console.error(`Error reading "${key}" from localStorage`, error);
        localStorage.removeItem(key);
    }
    return defaultValue;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

// FIX: Explicitly define props type to help TypeScript's type inference.
interface LanguageProviderProps {
    children: ReactNode;
}

// FIX: Changed component to be explicitly typed as a React.FC to resolve a subtle type inference issue where the 'children' prop was not being recognized.
export const LanguageProvider: FC<LanguageProviderProps> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(getInitialState('language', 'en'));

    useEffect(() => {
        localStorage.setItem('language', JSON.stringify(language));
        document.body.style.fontFamily = language === 'th' ? "'Sarabun', sans-serif" : "'Inter', sans-serif";
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(lang => (lang === 'en' ? 'th' : 'en'));
    };

    const t = (key: keyof Translations): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};

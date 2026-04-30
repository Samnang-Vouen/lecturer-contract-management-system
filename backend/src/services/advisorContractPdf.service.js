import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { AdvisorContract, Department, LecturerProfile, User } from '../model/index.js';
import { HTTP_STATUS } from '../config/constants.js';
import {
	AppError,
	ConflictError,
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from '../utils/errors.js';
import { assertAdvisorContractViewAccess } from './advisorContract.service.js';

function wrapUnexpectedError(error, fallbackMessage) {
	if (error instanceof AppError) return error;
	return new AppError(fallbackMessage, HTTP_STATUS.SERVER_ERROR, {
		payload: { message: fallbackMessage, error: error.message },
	});
}

function toKhmerDigits(str) {
	const map = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
	return String(str).replace(/[0-9]/g, (digit) => map[digit]);
}

function escapeHtml(value) {
	return String(value ?? '').replace(/[&<>"']/g, (ch) => {
		if (ch === '&') return '&amp;';
		if (ch === '<') return '&lt;';
		if (ch === '>') return '&gt;';
		if (ch === '"') return '&quot;';
		return '&#39;';
	});
}

function loadTemplate(name) {
	const filePath = path.join(process.cwd(), 'src', 'utils', name);
	return fs.readFileSync(filePath, 'utf8');
}

function embedLogo(html) {
	const logoFiles = ['cadt_logo.png', 'CADT_logo_with_KH.jpg'];
	let output = html;

	for (const fileName of logoFiles) {
		const logoPath = path.join(process.cwd(), 'src', 'utils', fileName);
		let base64 = '';
		try {
			base64 = fs.readFileSync(logoPath, 'base64');
		} catch {
			base64 = '';
		}
		if (!base64) continue;

		const ext = path.extname(fileName).toLowerCase();
		const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
		const dataUri = `data:${mime};base64,${base64}`;
		const escapedFileName = fileName.replace('.', '\\.');
		output = output.replace(new RegExp(`src=(['"])${escapedFileName}\\1`, 'g'), `src="${dataUri}"`);
	}

	return output;
}

function signatureTag(filePath) {
	try {
		if (!filePath || !fs.existsSync(filePath)) return '';
		const ext = path.extname(filePath).toLowerCase();
		const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
		const base64 = fs.readFileSync(filePath, 'base64');
		return `<img src="data:${mime};base64,${base64}" style="max-height:70px; max-width:220px;" />`;
	} catch {
		return '';
	}
}

function ordinalSuffix(value) {
	const v = value % 100;
	if (v >= 11 && v <= 13) return 'th';
	switch (value % 10) {
		case 1:
			return 'st';
		case 2:
			return 'nd';
		case 3:
			return 'rd';
		default:
			return 'th';
	}
}

function formatDateEnWithSup(dateOnlyStr) {
	if (!dateOnlyStr) return '—';
	const date = new Date(dateOnlyStr);
	if (Number.isNaN(date.getTime())) return '—';
	const day = date.getDate();
	const day2 = String(day).padStart(2, '0');
	const month = date.toLocaleString('en-GB', { month: 'long' });
	const year = date.getFullYear();
	return `${day2}<sup>${ordinalSuffix(day)}</sup> ${month} ${year}`;
}

function formatDateKh(dateOnlyStr) {
	if (!dateOnlyStr) return '';
	const date = new Date(dateOnlyStr);
	if (Number.isNaN(date.getTime())) return '';
	const khMonths = [
		'មករា',
		'កុម្ភៈ',
		'មីនា',
		'មេសា',
		'ឧសភា',
		'មិថុនា',
		'កក្កដា',
		'សីហា',
		'កញ្ញា',
		'តុលា',
		'វិច្ឆិកា',
		'ធ្នូ',
	];
	const day = toKhmerDigits(String(date.getDate()).padStart(2, '0'));
	const monthName = khMonths[date.getMonth()] || '';
	const year = toKhmerDigits(date.getFullYear());
	return `${day} ខែ${monthName} ឆ្នាំ${year}`;
}

function getKhDateParts(dateOnlyStr) {
	if (!dateOnlyStr) return null;
	const date = new Date(dateOnlyStr);
	if (Number.isNaN(date.getTime())) return null;

	const khMonths = [
		'មករា',
		'កុម្ភៈ',
		'មីនា',
		'មេសា',
		'ឧសភា',
		'មិថុនា',
		'កក្កដា',
		'សីហា',
		'កញ្ញា',
		'តុលា',
		'វិច្ឆិកា',
		'ធ្នូ',
	];

	return {
		day: toKhmerDigits(String(date.getDate()).padStart(2, '0')),
		month: khMonths[date.getMonth()] || '',
		year: toKhmerDigits(date.getFullYear()),
	};
}

function formatAdvisorSummaryDateRangeKh(startDate, endDate) {
	const start = getKhDateParts(startDate);
	const end = getKhDateParts(endDate);
	if (!start || !end) return 'កាលបរិច្ឆេទមិនត្រឹមត្រូវ';
	return [
		`ថ្ងៃទី<span class="red">${start.day}</span> ខែ${start.month} ឆ្នាំ<span class="red">${start.year}</span>`,
		`រហូតដល់ថ្ងៃទី <span class="red">${end.day}</span> ខែ <span class="red">${end.month}</span> ឆ្នាំ<span class="red">${end.year}</span>`,
	].join(' ');
}

function formatMoneySummary(value, locale = 'en-US') {
	const amount = Number(value) || 0;
	return amount.toLocaleString(locale, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function buildAdvisorProgramLabel(contract) {
	const parts = [];
	if (contract?.capstone_1) parts.push('Capstone I');
	if (contract?.capstone_2) parts.push('Capstone II');
	if (contract?.internship_1) parts.push('Internship I');
	if (contract?.internship_2) parts.push('Internship II');
	return parts.length ? parts.join(', ') : 'Advisor Program';
}

function buildAdvisorQuarterLabel(contract) {
	const quarters = [];
	if (contract?.capstone_1 || contract?.internship_1) quarters.push('1');
	if (contract?.capstone_2 || contract?.internship_2) quarters.push('2');
	return quarters.join(', ');
}

function buildAdvisorSummaryProgramLabelKh(contracts) {
	const labels = [];
	const seen = new Set();

	const add = (key, label) => {
		if (key && !seen.has(key)) {
			seen.add(key);
			labels.push(label);
		}
	};

	for (const contract of contracts || []) {
		if (contract?.internship_1) add('internship_1', 'កម្មសិក្សាលើកទី១');
		if (contract?.internship_2) add('internship_2', 'កម្មសិក្សាលើកទី២');
		if (contract?.capstone_1) add('capstone_1', 'Capstone I');
		if (contract?.capstone_2) add('capstone_2', 'Capstone II');
	}

	return labels.length ? labels.join(', ') : 'កម្មវិធីដឹកនាំ';
}

function normalizeSummaryType(value) {
	const normalized = String(value || '')
		.trim()
		.toUpperCase()
		.replace(/\s+/g, '_')
		.replace(/-/g, '_');

	const aliasMap = {
		CAPSTONE_I: 'CAPSTONE_1',
		CAPSTONE_1: 'CAPSTONE_1',
		CAPSTONE_II: 'CAPSTONE_2',
		CAPSTONE_2: 'CAPSTONE_2',
		INTERNSHIP_I: 'INTERNSHIP_1',
		INTERNSHIP_1: 'INTERNSHIP_1',
		INTERNSHIP_II: 'INTERNSHIP_2',
		INTERNSHIP_2: 'INTERNSHIP_2',
	};

	return aliasMap[normalized] || '';
}

function getSummaryTypeLabels(typeKey) {
	const map = {
		CAPSTONE_1: { en: 'Capstone I', kh: 'Capstone I' },
		CAPSTONE_2: { en: 'Capstone II', kh: 'Capstone II' },
		INTERNSHIP_1: { en: 'Internship I', kh: 'កម្មសិក្សាលើកទី១' },
		INTERNSHIP_2: { en: 'Internship II', kh: 'កម្មសិក្សាលើកទី២' },
	};
	return map[typeKey] || null;
}

function advisorContractMatchesSummaryType(contract, typeKey) {
	if (!typeKey) return true;
	switch (typeKey) {
		case 'CAPSTONE_1':
			return !!contract?.capstone_1;
		case 'CAPSTONE_2':
			return !!contract?.capstone_2;
		case 'INTERNSHIP_1':
			return !!contract?.internship_1;
		case 'INTERNSHIP_2':
			return !!contract?.internship_2;
		default:
			return false;
	}
}

function normalizeGenerationNumber(value) {
	const raw = String(value || '').trim();
	if (!raw) return '';
	const match = raw.match(/(\d+)/);
	return match ? match[1] : '';
}

function inferAdvisorSummaryGeneration(contracts, explicitGeneration) {
	const explicit = normalizeGenerationNumber(explicitGeneration);
	if (explicit) return explicit;

	for (const contract of contracts || []) {
		const students = Array.isArray(contract?.students) ? contract.students : [];
		for (const student of students) {
			const inferred =
				normalizeGenerationNumber(student?.generation) ||
				normalizeGenerationNumber(student?.gen) ||
				normalizeGenerationNumber(student?.class_generation) ||
				normalizeGenerationNumber(student?.class_name) ||
				normalizeGenerationNumber(student?.className);
			if (inferred) return inferred;
		}
	}

	return '';
}

function toNum(value) {
	if (value === null || value === undefined || value === '') return 0;
	const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
	return Number.isFinite(num) ? num : 0;
}

function toDateOnly(value) {
	if (!value) return null;
	try {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return null;
		return date.toISOString().slice(0, 10);
	} catch {
		return null;
	}
}

async function renderPdf(html, options = { format: 'A4', printBackground: true }) {
	let browser;
	try {
		browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: 'networkidle0' });
		return await page.pdf(options);
	} finally {
		if (browser) await browser.close();
	}
}

export async function generateAdvisorSummaryPdfDocument({ user, query }) {
	try {
		const role = String(user?.role || '').toLowerCase();
		if (role !== 'admin') {
			throw new ForbiddenError('Only department admins can generate advisor contract summary PDFs', {
				payload: { message: 'Only department admins can generate advisor contract summary PDFs' },
			});
		}

		const contractId = parseInt(query.contract_id || '', 10);
		const requestedAcademicYear = String(query.academic_year || '').trim();
		const requestedType = normalizeSummaryType(query.type);
		const requestedClassName = String(query.class_name || query.className || query.gen || '').trim();
		const explicitFilterMode = !!(requestedAcademicYear || requestedType);
		const departmentName = user?.department_name || null;
		let startDate = null;
		let endDate = null;

		if (!departmentName) {
			throw new ForbiddenError('Your admin account is missing a department', {
				payload: { message: 'Your admin account is missing a department' },
			});
		}

		if (explicitFilterMode && (!requestedAcademicYear || !requestedType)) {
			throw new ValidationError('academic_year and type are required for summary filter generation', {
				payload: { message: 'academic_year and type are required for summary filter generation' },
			});
		}

		let contracts = [];
		const commonInclude = [
			{
				model: User,
				as: 'lecturer',
				attributes: ['id', 'email', 'display_name', 'department_name'],
				where: { department_name: departmentName },
				required: true,
				include: [
					{
						model: LecturerProfile,
						attributes: ['full_name_english', 'full_name_khmer', 'bank_name', 'account_number'],
						required: false,
					},
				],
			},
		];
		const commonOrder = [
			[{ model: User, as: 'lecturer' }, 'display_name', 'ASC'],
			['id', 'ASC'],
		];

		if (Number.isInteger(contractId) && contractId > 0 && !explicitFilterMode) {
			const allowedContract = await assertAdvisorContractViewAccess(user, contractId, {
				attributes: ['id', 'lecturer_user_id', 'start_date', 'end_date'],
			});
			startDate = toDateOnly(allowedContract.start_date);
			endDate = toDateOnly(allowedContract.end_date);
			contracts = await AdvisorContract.findAll({
				where: { start_date: startDate, end_date: endDate },
				include: commonInclude,
				order: commonOrder,
			});
		} else if (explicitFilterMode) {
			const advisorContracts = await AdvisorContract.findAll({
				where: { academic_year: requestedAcademicYear },
				include: commonInclude,
				order: commonOrder,
			});

			const filteredContracts = advisorContracts.filter((contract) =>
				advisorContractMatchesSummaryType(contract, requestedType)
			);

			if (!filteredContracts.length) {
				throw new NotFoundError('No advisor contracts found for the selected academic year and type', {
					payload: { message: 'No advisor contracts found for the selected academic year and type' },
				});
			}

			const dateKeys = Array.from(
				new Set(
					filteredContracts.map(
						(contract) => `${toDateOnly(contract.start_date) || ''}|${toDateOnly(contract.end_date) || ''}`
					)
				)
			);

			if (dateKeys.length !== 1) {
				throw new ConflictError('Selected advisor contracts do not share a single start and end date range', {
					payload: { message: 'Selected advisor contracts do not share a single start and end date range' },
				});
			}

			[startDate, endDate] = dateKeys[0].split('|');
			contracts = filteredContracts;
		} else {
			startDate = toDateOnly(query.start_date);
			endDate = toDateOnly(query.end_date);
			if (!startDate || !endDate) {
				throw new ValidationError('start_date and end_date are required when contract_id is not provided', {
					payload: { message: 'start_date and end_date are required when contract_id is not provided' },
				});
			}

			contracts = await AdvisorContract.findAll({
				where: { start_date: startDate, end_date: endDate },
				include: commonInclude,
				order: commonOrder,
			});
		}

		if (!contracts.length) {
			throw new NotFoundError('No advisor contracts found for the requested department and date range', {
				payload: { message: 'No advisor contracts found for the requested department and date range' },
			});
		}

		const department = await Department.findOne({
			where: { dept_name: departmentName },
			attributes: ['dept_name_khmer'],
		});
		const departmentNameKhmer = department?.dept_name_khmer || departmentName;

		const usdToKhr = parseFloat(process.env.USD_TO_KHR || process.env.EXCHANGE_RATE_KHR || '4100');
		const exchangeRate = Number.isFinite(usdToKhr) ? usdToKhr : 4100;
		const selectedTypeLabels = getSummaryTypeLabels(requestedType);
		const programLabelKh = selectedTypeLabels?.kh || buildAdvisorSummaryProgramLabelKh(contracts);
		const generationNumber = inferAdvisorSummaryGeneration(
			contracts,
			query.generation || query.gen || requestedClassName
		);
		const generationKh = generationNumber ? toKhmerDigits(generationNumber) : '........';

		let totalUsd = 0;
		let totalKhr = 0;
		const summaryRows = contracts
			.map((contract, index) => {
				const profile = contract.lecturer?.LecturerProfile || null;
				const rate = toNum(contract.hourly_rate);
				const students = Array.isArray(contract.students) ? contract.students : [];
				const studentsCount = students.length;
				const hoursPerStudent = toNum(contract.hours_per_student);
				const chargeHours = toNum(contract.join_judging_hours);
				const totalHours = studentsCount * (hoursPerStudent + chargeHours);
				const paymentUsd = totalHours * rate;
				const paymentKhr = Math.round(paymentUsd * exchangeRate);

				totalUsd += paymentUsd;
				totalKhr += paymentKhr;

				const nameEn =
					profile?.full_name_english ||
					contract.lecturer?.display_name ||
					contract.lecturer?.email ||
					'-';
				const nameKh = profile?.full_name_khmer || '-';
				const subject = selectedTypeLabels?.en || buildAdvisorProgramLabel(contract);
				const academicYear = contract.academic_year || '-';
				const quarter = buildAdvisorQuarterLabel(contract) || '-';

				return `
			<tr>
				<td class="nowrap">${toKhmerDigits(index + 1)}</td>
				<td class="txt-left nowrap">${escapeHtml(subject)}</td>
				<td class="nowrap">${escapeHtml(nameEn)}</td>
				<td class="nowrap">${escapeHtml(nameKh)}</td>
				<td class="nowrap">${escapeHtml(profile?.account_number || '-')}</td>
				<td class="nowrap">${escapeHtml(profile?.bank_name || '-')}</td>
				<td class="nowrap">${toKhmerDigits(chargeHours)}</td>
				<td class="nowrap">${toKhmerDigits(rate)}</td>
				<td class="nowrap">${toKhmerDigits(studentsCount)}</td>
				<td class="nowrap">${toKhmerDigits(hoursPerStudent)}</td>
				<td class="nowrap">${toKhmerDigits(totalHours)}</td>
				<td class="money nowrap">$${formatMoneySummary(paymentUsd)}</td>
				<td class="money nowrap">${toKhmerDigits(formatMoneySummary(paymentKhr))}៛</td>
				<td class="nowrap">${toKhmerDigits(quarter)}</td>
				<td class="nowrap">${escapeHtml(academicYear)}</td>
			</tr>`;
			})
			.join('');

		let html = loadTemplate('Advisor_Contract_Summary.html');
		html = embedLogo(html)
			.replaceAll('{dept_name_khmer}', escapeHtml(departmentNameKhmer))
			.replaceAll(
				'{summary_title_line_1}',
				`ចំណាយប្រាក់គ្រូដឹកនាំចុះ ${escapeHtml(programLabelKh)} សម្រាប់ថ្នាក់បរិញ្ញាបត្រជំនាន់ទី ${generationKh}`
			)
			.replaceAll('{summary_title_line_2}', 'នៃបណ្ឌិតសភាបច្ចេកវិទ្យាឌីជីថលកម្ពុជា')
			.replaceAll('{summary_date_range_kh}', formatAdvisorSummaryDateRangeKh(startDate, endDate))
			.replaceAll('{summary_rows}', summaryRows)
			.replaceAll('{summary_total_usd}', `$${formatMoneySummary(totalUsd)}`)
			.replaceAll('{summary_total_khr}', `${toKhmerDigits(formatMoneySummary(totalKhr))}៛`);

		const pdfBuffer = await renderPdf(html);
		const safeDepartment =
			String(departmentName)
				.replace(/[^A-Za-z0-9]+/g, '_')
				.replace(/^_+|_+$/g, '') || 'Department';

		return {
			contentType: 'application/pdf',
			fileName: `${safeDepartment}_AdvisorContractSummary_${startDate}_${endDate}.pdf`,
			buffer: pdfBuffer,
		};
	} catch (error) {
		throw wrapUnexpectedError(error, 'Failed to generate advisor contract summary PDF');
	}
}

export async function generateAdvisorPdfDocument({ user, contractId }) {
	try {
		await assertAdvisorContractViewAccess(user, contractId, {
			attributes: ['id', 'lecturer_user_id'],
		});

		const contract = await AdvisorContract.findByPk(contractId, {
			include: [
				{
					model: User,
					as: 'lecturer',
					attributes: ['id', 'email', 'display_name', 'department_name'],
					include: [{ model: LecturerProfile, attributes: ['title', 'full_name_khmer'], required: false }],
					required: false,
				},
				{
					model: User,
					as: 'creator',
					attributes: ['id', 'email', 'display_name', 'department_name'],
					required: false,
				},
			],
		});

		if (!contract) {
			throw new NotFoundError('Not found', { payload: { message: 'Not found' } });
		}

		let html = embedLogo(loadTemplate('Advisor_Contract.html'));
		const titleRaw = contract.lecturer?.LecturerProfile?.title || null;
		const titleEnMap = { Mr: 'Mr.', Ms: 'Ms.', Mrs: 'Mrs.', Dr: 'Dr.', Prof: 'Prof.' };
		const titleKhMap = {
			Mr: 'លោក',
			Ms: 'កញ្ញា',
			Mrs: 'លោកស្រី',
			Dr: 'ឌុកទ័រ',
			Prof: 'សាស្ត្រាចារ្យ',
		};
		const enPrefix = titleRaw && titleEnMap[titleRaw] ? `${titleEnMap[titleRaw]} ` : '';
		const khPrefix = titleRaw && titleKhMap[titleRaw] ? `${titleKhMap[titleRaw]} ` : '';
		const advisorNameBase = contract.lecturer?.display_name || contract.lecturer?.email || 'Advisor';
		const advisorNameEn = `${enPrefix}${advisorNameBase}`.trim();
		const advisorKhBase = contract.lecturer?.LecturerProfile?.full_name_khmer || advisorNameBase;
		const advisorKhName = `${khPrefix}${advisorKhBase}`.trim();
		const departmentName = contract.lecturer?.department_name || '';
		const academicYear = contract.academic_year || '';
		const students = Array.isArray(contract.students) ? contract.students : [];
		const studentsCount = students.length;
		const respParts = [];
		if (contract.capstone_1) respParts.push('Capstone I');
		if (contract.capstone_2) respParts.push('Capstone II');
		if (contract.internship_1) respParts.push('Internship I');
		if (contract.internship_2) respParts.push('Internship II');
		const programLabelEn = respParts.length ? respParts.join(', ') : 'Advisor Program';

		const hourlyRateUsd = toNum(contract.hourly_rate);
		const hoursPerStudent = toNum(contract.hours_per_student);
		const judgingHours = toNum(contract.join_judging_hours);
		const totalHoursPerStudent = hoursPerStudent * studentsCount;
		const totalJudgingHours = judgingHours * studentsCount;
		const totalHours = totalHoursPerStudent + totalJudgingHours;
		const totalUsd = totalHours * hourlyRateUsd;
		const usdToKhr = parseFloat(process.env.USD_TO_KHR || process.env.EXCHANGE_RATE_KHR || '4100');
		const totalKhr = Math.round(
			(Number.isFinite(totalUsd) ? totalUsd : 0) * (Number.isFinite(usdToKhr) ? usdToKhr : 4100)
		);

		const duties = Array.isArray(contract.duties) ? contract.duties : [];
		const dutiesLisEn = (duties.length ? duties : ['-'])
			.map((duty) => `<li>${escapeHtml(duty)}</li>`)
			.join('');
		const studentRowsSource = students.length ? students : [{ student_name: '-', student_code: '' }];
		const studentsRowsEn = studentRowsSource
			.map((student, index) => {
				const name = escapeHtml(student?.student_name || '-');
				const code = escapeHtml(student?.student_code || '');
				const label = code ? `${name}, ${code}` : name;
				const topic = escapeHtml(
					student?.project_title || student?.topic_title || student?.project_topic_title || '-'
				);
				const company = escapeHtml(student?.company_name || '-');
				return `
			<tr>
				<td>${index + 1}</td>
				<td style="text-align:left;">${label}</td>
				<td style="text-align:left;">${topic}</td>
				<td style="text-align:left;">${company}</td>
			</tr>`;
			})
			.join('');
		const studentsRowsKh = studentRowsSource
			.map((student, index) => {
				const name = escapeHtml(student?.student_name || '-');
				const code = escapeHtml(student?.student_code || '');
				const label = code ? `${name}, ${code}` : name;
				const topic = escapeHtml(
					student?.project_title || student?.topic_title || student?.project_topic_title || '-'
				);
				const company = escapeHtml(student?.company_name || '-');
				return `
			<tr>
				<td>${toKhmerDigits(index + 1)}</td>
				<td style="text-align:left;">${label}</td>
				<td style="text-align:left;">${topic}</td>
				<td style="text-align:left;">${company}</td>
			</tr>`;
			})
			.join('');

		const dutiesRowsEn = `
			<tr>
				<td>1</td>
				<td>
					Advisory:<br>
					<ul class="bullet-list">
						${dutiesLisEn}
					</ul>
				</td>
				<td><strong>${hoursPerStudent || 0}</strong></td>
				<td><strong>${studentsCount}</strong></td>
				<td><strong>${totalHoursPerStudent || 0}</strong></td>
			</tr>
			<tr>
				<td>2</td>
				<td>Join judging</td>
				<td><strong>${judgingHours || 0}</strong></td>
				<td><strong>${studentsCount}</strong></td>
				<td><strong>${totalJudgingHours || 0}</strong></td>
			</tr>`;
		const dutiesRowsKh = `
			<tr>
				<td>${toKhmerDigits(1)}</td>
				<td>
					ការដឹកនាំ:<br>
					<ul class="bullet-list">
						${dutiesLisEn}
					</ul>
				</td>
				<td><strong>${toKhmerDigits(hoursPerStudent || 0)}</strong></td>
				<td><strong>${toKhmerDigits(studentsCount)}</strong></td>
				<td><strong>${toKhmerDigits(totalHoursPerStudent || 0)}</strong></td>
			</tr>
			<tr>
				<td>${toKhmerDigits(2)}</td>
				<td>ចូលរួមជាគណៈកម្មការ</td>
				<td><strong>${toKhmerDigits(judgingHours || 0)}</strong></td>
				<td><strong>${toKhmerDigits(studentsCount)}</strong></td>
				<td><strong>${toKhmerDigits(totalJudgingHours || 0)}</strong></td>
			</tr>`;

		html = html
			.replaceAll('{advisor_name_en}', advisorNameEn)
			.replaceAll('{advisor_name_kh}', advisorKhName)
			.replaceAll('{start_date_en}', formatDateEnWithSup(contract.start_date))
			.replaceAll('{start_date_kh}', formatDateKh(contract.start_date))
			.replaceAll('{academic_year}', escapeHtml(academicYear))
			.replaceAll('{program_label_en}', escapeHtml(programLabelEn))
			.replaceAll('{department_name}', escapeHtml(departmentName))
			.replaceAll('{management_signature_path}', signatureTag(contract.management_signature_path))
			.replaceAll('{advisor_signature_path}', signatureTag(contract.advisor_signature_path))
			.replaceAll('{students_rows_en}', studentsRowsEn)
			.replaceAll('{students_rows_kh}', studentsRowsKh)
			.replaceAll('{duties_rows_en}', dutiesRowsEn)
			.replaceAll('{duties_rows_kh}', dutiesRowsKh)
			.replaceAll('{total_hours}', String(totalHours || 0))
			.replaceAll('{total_hours_kh}', toKhmerDigits(String(totalHours || 0)))
			.replaceAll('{total_payment_khr_en}', totalKhr.toLocaleString('en-US'))
			.replaceAll('{total_payment_khr_kh}', toKhmerDigits(totalKhr.toLocaleString('en-US')));

		const pdfBuffer = await renderPdf(html);
		const fileBase =
			String(advisorNameBase)
				.replace(/[^A-Za-z0-9]+/g, ' ')
				.trim()
				.replace(/\s+/g, '') || `AdvisorContract${contractId}`;

		return {
			contentType: 'application/pdf',
			fileName: `${fileBase}_AdvisorContract.pdf`,
			buffer: pdfBuffer,
		};
	} catch (error) {
		throw wrapUnexpectedError(error, 'Failed to generate advisor contract PDF');
	}
}
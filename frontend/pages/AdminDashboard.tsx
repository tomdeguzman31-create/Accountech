import React, { useEffect, useMemo, useState } from 'react';
import {
	Activity,
	ArrowUpRight,
	BarChart3,
	BookOpen,
	ChevronDown,
	CalendarDays,
	Download,
	Gauge,
	Plus,
	PencilLine,
	Search,
	Layers3,
	X,
	Radar,
	ShieldCheck,
	Target,
	TrendingUp,
	Trophy,
	Users,
} from 'lucide-react';
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar as RadarSeries,
	RadarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { useAuth } from '../App';
import { COLORS, DEMO_USERS, INITIAL_DIFFICULTY_TIERS, MOCK_SUBJECTS, READINESS_DATA } from '../constants';
import { UserRole } from '../types';
import {
        adminApi,
        analyticsApi,
        leaderboardApi,
        questionApi,
        studentApi,
        subjectApi,
        type AdminReadinessReport,
        type FacultyRosterReadinessRow,
        type LeaderboardEntry,
} from '../services/api';

type StatCardProps = {
	label: string;
	value: string | number;
	icon: React.ComponentType<{ size?: number; className?: string }>;
	iconBg: string;
	iconColor: string;
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, iconBg, iconColor }) => (
	<div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
		<div className="flex items-start justify-between gap-3">
			<div>
				<p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
				<p className="mt-1 text-2xl font-black tracking-tight text-slate-900">{value}</p>
			</div>
			<div className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm" style={{ backgroundColor: iconBg }}>
				<Icon size={20} className={iconColor} />
			</div>
		</div>
	</div>
);

type PanelProps = {
	title: string;
	subtitle?: string;
	icon?: React.ComponentType<{ size?: number; className?: string }>;
	action?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
};

const Panel: React.FC<PanelProps> = ({ title, subtitle, icon: Icon, action, children, className = '' }) => (
	<section className={`rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ${className}`}>
		<div className="mb-4 flex items-start justify-between gap-4">
			<div>
				<div className="flex items-center gap-2">
					{Icon ? <Icon size={18} className="text-[#1e3a8a]" /> : null}
					<h2 className="text-[15px] font-black tracking-tight text-slate-900">{title}</h2>
				</div>
				{subtitle ? <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{subtitle}</p> : null}
			</div>
			{action}
		</div>
		{children}
	</section>
);

const formatPercent = (value: number) => `${value.toFixed(0)}%`;

type QuestionReportRow = {
	stem: string;
	subject: string;
	difficulty: string;
	attempts: number;
	passingRate: number;
	status: 'IDEAL' | 'AVERAGE' | 'FOR REVIEW';
};

type StudentHistoryRow = {
	name: string;
	studentId: string;
	section: string;
	batch: string;
	email: string;
	accuracy: number;
	weakestSubject: string;
	attempts: number;
	correct: number;
	wrong: number;
	performance: Array<{ week: string; score: number }>;
        drillHistory: Array<{ subject: string; date: string; score: string; status: 'Passed' | 'Remedial' }>;
};

type AdminOverviewData = {
        subjectAverages: Array<{
                subjectCode?: string;
                subjectName?: string;
                avgAccuracy?: number;
                totalSessions?: number;
        }>;
        topStudents: Array<Record<string, unknown>>;
        engagement: {
                totalAllowedStudents?: number;
                registeredStudents?: number;
                activeStudents?: number;
        };
};

const AdminDashboard: React.FC = () => {
	const { activeTab, setActiveTab } = useAuth();
	const [showDifficultyReports, setShowDifficultyReports] = useState(false);
	const [showAddTierModal, setShowAddTierModal] = useState(false);
	const [showAddInstructorModal, setShowAddInstructorModal] = useState(false);
	const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
	const [showAddSectionModal, setShowAddSectionModal] = useState(false);
	const [showComposeAnnouncementModal, setShowComposeAnnouncementModal] = useState(false);
	const [leaderboardView, setLeaderboardView] = useState<'GLOBAL' | 'PASSED'>('GLOBAL');
	const [selectedStudent, setSelectedStudent] = useState<StudentHistoryRow | null>(null);
	const [facultySearch, setFacultySearch] = useState('');

	const facultyCount = DEMO_USERS.filter((user) => user.role === UserRole.FACULTY).length;
	const studentCount = 2;
	const questionCount = 10;
	const passingForecast = 75;

	const stats = useMemo(
		() => [
			{ label: 'Total Faculty', value: facultyCount, icon: Users, iconBg: '#eef2ff', iconColor: 'text-[#3652a3]' },
			{ label: 'Total Students', value: studentCount, icon: Target, iconBg: '#e8f7ef', iconColor: 'text-[#0f9d58]' },
			{ label: 'Question Bank', value: questionCount, icon: BookOpen, iconBg: '#f5e9ff', iconColor: 'text-[#9b4ed8]' },
			{ label: 'Passing Forecast', value: `${passingForecast}%`, icon: TrendingUp, iconBg: '#fff3cd', iconColor: 'text-[#d7a400]' },
		],
		[facultyCount, studentCount, questionCount, passingForecast],
	);

	const trendData = [
		{ year: '2022', passingLikelihood: 0, averageAccuracy: 0 },
		{ year: '2023', passingLikelihood: 0, averageAccuracy: 0 },
		{ year: '2024', passingLikelihood: 0, averageAccuracy: 0 },
		{ year: '2026(Current)', passingLikelihood: 70, averageAccuracy: 50 },
	];

	const radarData = [
		{ subject: 'FAR', value: 82 },
		{ subject: 'TAX', value: 74 },
		{ subject: 'AUD', value: 60 },
		{ subject: 'MAS', value: 68 },
		{ subject: 'RFBT', value: 56 },
		{ subject: 'AFAR', value: 78 },
	];

	const weeklyEngagement = [
		{ day: 'Mon', value: 450 },
		{ day: 'Tue', value: 540 },
		{ day: 'Wed', value: 520 },
		{ day: 'Thu', value: 640 },
		{ day: 'Fri', value: 610 },
		{ day: 'Sat', value: 330 },
		{ day: 'Sun', value: 260 },
	];

	const facultyEfficiency = [
		{ name: 'Faculty 1', score: 75, risk: false },
		{ name: 'Faculty 2', score: 42, risk: true },
		{ name: 'Faculty 3', score: 75, risk: false },
		{ name: 'Faculty 4', score: 42, risk: true },
		{ name: 'Faculty 5', score: 75, risk: false },
	];

	const questionBankAnalysis = [
		{ code: 'FAR', score: 85, color: '#3652a3' },
		{ code: 'TAX', score: 60, color: '#3652a3' },
		{ code: 'AUD', score: 40, color: '#3652a3' },
		{ code: 'AFAR', score: 39, color: '#d6a11e' },
		{ code: 'MAS', score: 20, color: '#f97316' },
		{ code: 'RFBT', score: 19, color: '#ef4444' },
	];

	const subjectEfficiency = [
		{ code: 'TAX', blue: 75, red: 42 },
		{ code: 'AUD', blue: 75, red: 42 },
		{ code: 'MAS', blue: 75, red: 42 },
		{ code: 'FAR', blue: 75, red: 42 },
		{ code: 'AFAR', blue: 75, red: 42 },
	];

	const sectionReadiness = [
		{ code: 'BSBA - M1', blue: 75, red: 42 },
		{ code: 'BSBA - M2', blue: 75, red: 42 },
		{ code: 'BSBA - M3', blue: 75, red: 42 },
		{ code: 'BSBA - M4', blue: 75, red: 42 },
		{ code: 'BSBA - M5', blue: 75, red: 42 },
	];

	const gaugeData = [
		{ name: 'Passing', value: 50 },
		{ name: 'Remaining', value: 50 },
	];

	const students: StudentHistoryRow[] = [
		{
			name: 'Student Name',
			studentId: '01-1234-123456',
			section: 'South-1',
			batch: '2024',
			email: 'student@phinmaed.com',
			accuracy: 50,
			weakestSubject: 'AUD',
			attempts: 10,
			correct: 5,
			wrong: 5,
			performance: [
				{ week: 'Week 1', score: 30 },
				{ week: 'Week 2', score: 42 },
				{ week: 'Week 3', score: 58 },
				{ week: 'Week 4', score: 81 },
				{ week: 'Week 5', score: 77 },
				{ week: 'Week 6', score: 72 },
			],
			drillHistory: [
				{ subject: 'FAR', date: 'Jun 28, 2026', score: '78%', status: 'Passed' },
				{ subject: 'AUD', date: 'Jun 24, 2026', score: '52%', status: 'Remedial' },
				{ subject: 'TAX', date: 'Jun 20, 2026', score: '69%', status: 'Passed' },
			],
		},
		{
			name: 'Student Name',
			studentId: '01-2222-999999',
			section: 'North-2',
			batch: '2024',
			email: 'student@phinmaed.com',
			accuracy: 80,
			weakestSubject: 'TAX',
			attempts: 12,
			correct: 10,
			wrong: 2,
			performance: [
				{ week: 'Week 1', score: 41 },
				{ week: 'Week 2', score: 50 },
				{ week: 'Week 3', score: 61 },
				{ week: 'Week 4', score: 74 },
				{ week: 'Week 5', score: 81 },
				{ week: 'Week 6', score: 84 },
			],
			drillHistory: [
				{ subject: 'MAS', date: 'Jun 29, 2026', score: '84%', status: 'Passed' },
				{ subject: 'TAX', date: 'Jun 25, 2026', score: '77%', status: 'Passed' },
				{ subject: 'AUD', date: 'Jun 18, 2026', score: '73%', status: 'Passed' },
			],
		},
		{
			name: 'Student Name',
			studentId: '01-3333-888888',
			section: 'East-3',
			batch: '2024',
			email: 'student@phinmaed.com',
			accuracy: 39,
			weakestSubject: 'MAS',
			attempts: 8,
			correct: 3,
			wrong: 5,
			performance: [
				{ week: 'Week 1', score: 28 },
				{ week: 'Week 2', score: 35 },
				{ week: 'Week 3', score: 39 },
				{ week: 'Week 4', score: 44 },
				{ week: 'Week 5', score: 41 },
				{ week: 'Week 6', score: 39 },
			],
			drillHistory: [
				{ subject: 'MAS', date: 'Jun 27, 2026', score: '38%', status: 'Remedial' },
				{ subject: 'AUD', date: 'Jun 21, 2026', score: '41%', status: 'Remedial' },
				{ subject: 'FAR', date: 'Jun 17, 2026', score: '44%', status: 'Remedial' },
			],
		},
		{
			name: 'Student Name',
			studentId: '01-4444-777777',
			section: 'West-4',
			batch: '2024',
			email: 'student@phinmaed.com',
			accuracy: 80,
			weakestSubject: 'FAR',
			attempts: 11,
			correct: 9,
			wrong: 2,
			performance: [
				{ week: 'Week 1', score: 46 },
				{ week: 'Week 2', score: 58 },
				{ week: 'Week 3', score: 63 },
				{ week: 'Week 4', score: 76 },
				{ week: 'Week 5', score: 79 },
				{ week: 'Week 6', score: 80 },
			],
			drillHistory: [
				{ subject: 'FAR', date: 'Jun 30, 2026', score: '82%', status: 'Passed' },
				{ subject: 'RFBT', date: 'Jun 23, 2026', score: '79%', status: 'Passed' },
				{ subject: 'TAX', date: 'Jun 19, 2026', score: '75%', status: 'Passed' },
			],
		},
	];

	const getStudentStatus = (accuracy: number) => (accuracy >= 60 ? 'PASSED' : 'FAILED');
	const facultyMembers = DEMO_USERS.filter((user) => user.role === UserRole.FACULTY);
	const filteredFacultyMembers = facultyMembers.filter(
		(user) =>
			user.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
			user.email.toLowerCase().includes(facultySearch.toLowerCase()),
	);

	const questionReportRows: QuestionReportRow[] = [
		{ stem: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', subject: 'AUD', difficulty: 'EASY', attempts: 205, passingRate: 70, status: 'IDEAL' },
		{ stem: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', subject: 'AFAR', difficulty: 'AVERAGE', attempts: 240, passingRate: 18, status: 'FOR REVIEW' },
		{ stem: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', subject: 'TAX', difficulty: 'HARD', attempts: 170, passingRate: 38, status: 'AVERAGE' },
	];

	const leaderboardRows = useMemo(
		() =>
			students
				.map((student) => ({
					student,
					accuracy: student.accuracy,
					sessions: student.attempts,
				}))
				.filter(({ accuracy }) => (leaderboardView === 'PASSED' ? accuracy >= 60 : true))
				.sort((left, right) => right.accuracy - left.accuracy)
				.slice(0, 4)
				.map((entry, index) => ({
					rank: index + 1,
					name: entry.student.name,
					studentId: entry.student.studentId,
					accuracy: entry.accuracy,
					sessions: entry.sessions,
				})),
			[leaderboardView, students],
	);

	const exportData = () => {
		const rows = [
			['Category', 'Metric', 'Value'],
			['General', 'Total Faculty', String(facultyCount)],
			['General', 'Total Students', String(studentCount)],
			['General', 'Question Bank', String(questionCount)],
			['General', 'Passing Forecast', `${passingForecast}%`],
			...READINESS_DATA.map((entry) => ['Readiness', entry.year, `${entry.rate}%`]),
		];

		const csvContent = `data:text/csv;charset=utf-8,${rows.map((row) => row.join(',')).join('\n')}`;
		const link = document.createElement('a');
		link.href = encodeURI(csvContent);
		link.download = `admin_analytics_${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	if (activeTab === 'ITEM_ANALYSIS') {
		return (
			<div className="space-y-6 pb-8 text-slate-900">
				<Panel
					title="Question Bank Analysis Metric"
					icon={BookOpen}
					action={
						<div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
							<span className="rounded-full bg-emerald-300 px-4 py-2 text-emerald-900">IDEAL (40%+)</span>
							<span className="rounded-full bg-amber-300 px-4 py-2 text-amber-950">AVERAGE(20%-39%)</span>
							<span className="rounded-full bg-red-200 px-4 py-2 text-red-700">FOR REVIEW (≤19%)</span>
						</div>
					}
				>
					<div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 md:p-4">
						<div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
							<div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3">
								<Search size={16} className="text-slate-400" />
								<input
									type="text"
									placeholder="Search by question content or topic..."
									className="w-full bg-transparent text-sm font-semibold text-slate-600 outline-none placeholder:text-slate-400"
								/>
							</div>

							<div className="mt-3 grid gap-2 xl:grid-cols-[1fr_auto_auto_auto_auto]">
								{['All Subjects', 'All Difficulties', 'All Sections'].map((label) => (
									<button
										key={label}
										type="button"
										className="flex items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600"
									>
										<span>{label}</span>
										<ChevronDown size={14} />
									</button>
								))}
								<div className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
									<CalendarDays size={12} className="text-slate-400" />
									<span>dd/mm/yyyy</span>
									<span className="text-slate-300">TO</span>
									<span>dd/mm/yyyy</span>
									<CalendarDays size={12} className="text-slate-400" />
								</div>
								<button type="button" className="rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-lg font-black leading-none text-slate-700">×</button>
							</div>
						</div>

						<div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
							<div className="grid grid-cols-[2.1fr_0.7fr_0.8fr_0.9fr_0.9fr_0.7fr] bg-slate-100 px-4 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
								<div>Question Stem</div>
								<div>Subject</div>
								<div>Difficulty</div>
								<div>Total Attempts</div>
								<div>Passing Rate</div>
								<div>Status</div>
							</div>
							<div className="divide-y divide-slate-200">
								{questionReportRows.map((row) => (
									<div key={`${row.subject}-${row.difficulty}`} className="grid grid-cols-[2.1fr_0.7fr_0.8fr_0.9fr_0.9fr_0.7fr] items-center px-4 py-4 text-sm">
										<div className="pr-4 text-[13px] font-black leading-5 text-slate-900">{row.stem}</div>
										<div>
											<span className="rounded bg-slate-200 px-3 py-1 text-[11px] font-black text-[#3652a3]">{row.subject}</span>
										</div>
										<div className="text-[12px] font-black uppercase tracking-widest text-slate-900">{row.difficulty}</div>
										<div className="text-2xl font-black tracking-tight text-[#3652a3]">{row.attempts}</div>
										<div className="text-2xl font-black tracking-tight text-[#3652a3]">{row.passingRate}%</div>
										<div>
											<span
												className={`inline-flex rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest ${
													row.status === 'IDEAL'
														? 'bg-emerald-300 text-emerald-900'
														: row.status === 'AVERAGE'
															? 'bg-amber-300 text-amber-950'
															: 'bg-red-200 text-red-700'
												}`}
											>
												{row.status}
											</span>
										</div>
									</div>
								))}
								{Array.from({ length: 3 }).map((_, index) => (
									<div key={index} className="grid grid-cols-[2.1fr_0.7fr_0.8fr_0.9fr_0.9fr_0.7fr] items-center px-4 py-7 text-sm" />
								))}
							</div>
							<div className="border-t border-slate-200 py-4 text-center text-sm font-black text-slate-700">&lt;&lt; 1 2 3 4 5 &gt;&gt;</div>
						</div>
					</div>
				</Panel>
			</div>
		);
	}

	if (activeTab !== 'ANALYTICS') {
		if (activeTab === 'FACULTY') {
			return (
				<div className="space-y-6 pb-8 text-slate-900">
					<Panel title="Faculty Management" className="min-h-[420px]">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
							<div className="flex w-full max-w-[420px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
								<Search size={16} className="text-slate-400" />
								<input
									type="text"
									value={facultySearch}
									onChange={(event) => setFacultySearch(event.target.value)}
									placeholder="Search faculty by name or email..."
									className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
								/>
							</div>

							<button
								type="button"
								onClick={() => setShowAddInstructorModal(true)}
								className="inline-flex items-center gap-2 rounded-xl bg-[#3652a3] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-900/15 transition-transform hover:scale-[1.01]"
							>
								<Plus size={16} />
								Add Instructor
							</button>
						</div>

						<div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
							{filteredFacultyMembers.map((faculty) => (
								<div key={faculty.email} className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
									<div className="flex items-start justify-between gap-3">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-[#3652a3] shadow-sm">
												{faculty.name.charAt(0)}
											</div>
											<div>
												<p className="text-sm font-black text-slate-900">{faculty.name}</p>

										{showAddInstructorModal ? (
											<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-[2px]">
												<div className="relative w-full max-w-[366px] rounded-[1.05rem] border border-slate-200 bg-white px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.35)] md:px-5 md:py-5">
													<button
														type="button"
														onClick={() => setShowAddInstructorModal(false)}
														className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600"
														aria-label="Close register faculty modal"
													>
														<X size={26} strokeWidth={1.5} />
													</button>

													<h3 className="pr-10 text-[15px] font-black text-[#3652a3]">Register Faculty</h3>

													<div className="mt-4 space-y-4">
														<input
															type="text"
															placeholder="Full Name"
															className="h-[46px] w-full rounded-lg border border-slate-300 bg-slate-200 px-4 text-[13px] font-bold text-slate-700 outline-none placeholder:text-slate-500"
														/>
														<input
															type="email"
															placeholder="Phinma Email"
															className="h-[46px] w-full rounded-lg border border-slate-300 bg-slate-200 px-4 text-[13px] font-bold text-slate-700 outline-none placeholder:text-slate-500"
														/>
														<button
															type="button"
															className="flex h-[46px] w-full items-center justify-between rounded-lg border border-slate-300 bg-slate-200 px-4 text-[13px] font-bold text-slate-500"
														>
															<span>Assign Section</span>
															<ChevronDown size={18} className="text-slate-900" />
														</button>
														<button
															type="button"
															className="flex h-[46px] w-full items-center justify-between rounded-lg border border-slate-300 bg-slate-200 px-4 text-[13px] font-bold text-slate-500"
														>
															<span>Assign Subject</span>
															<ChevronDown size={18} className="text-slate-900" />
														</button>
														<button
															type="button"
															className="mt-4 h-[46px] w-full rounded-lg bg-[#3652a3] text-[13px] font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.12)] transition-transform hover:scale-[1.01]"
														>
															Register Instructor
														</button>
													</div>
												</div>
											</div>
										) : null}
												<p className="text-[11px] font-semibold text-slate-400">{faculty.email}</p>
											</div>
										</div>

										<div className="flex items-center gap-3 pt-0.5">
											<button type="button" className="text-slate-400 transition-colors hover:text-[#3652a3]" aria-label={`Edit ${faculty.name}`}>
												<PencilLine size={16} />
											</button>
											<button
												type="button"
												className="flex h-5 w-9 items-center rounded-full border border-[#1d7a4d] bg-white px-0.5"
												aria-label={`Toggle ${faculty.name} status`}
											>
												<span className="ml-auto h-3.5 w-3.5 rounded-full bg-[#1d7a4d]" />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</Panel>
				</div>
			);
		}

		if (activeTab === 'DIFFICULTIES') {
			return (
				<div className="space-y-6 pb-8 text-slate-900">
					<section className="relative overflow-hidden rounded-[2rem] bg-[#3652a3] px-6 py-6 text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)] md:px-8 md:py-7">
						<div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
							<div className="max-w-xl space-y-3">
								<h1 className="text-2xl font-black tracking-tight md:text-[28px]">Difficulty Level Management</h1>
								<p className="max-w-md text-[13px] leading-5 text-blue-100/75 md:text-[14px]">
									Define how the adaptive engine weights specific questions based on Blooms Taxonomy and CMA complexity standards.
								</p>
							</div>

							<div className="flex w-full max-w-[300px] flex-col gap-3 lg:pt-1">
								<div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-[#4862a6] px-4 py-3 shadow-inner">
									<Search size={18} className="text-white/70" />
									<input
										type="text"
										placeholder="Search tiers..."
										className="w-full bg-transparent text-[14px] font-semibold text-white outline-none placeholder:text-white/60"
									/>
								</div>

								<button
									type="button"
									onClick={() => setShowAddTierModal(true)}
									className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#f5c842] px-5 text-[15px] font-black text-[#1d7a4d] shadow-[0_6px_0_rgba(0,0,0,0.12)] transition-transform hover:translate-y-0.5"
								>
									<Plus size={18} />
									New Tier
								</button>
							</div>
						</div>

						<div className="absolute right-4 top-3 h-28 w-28 rounded-full border-[10px] border-white/10" />
						<div className="absolute right-12 top-7 h-20 w-20 rounded-full border-[10px] border-white/10" />
					</section>

					<div className="grid gap-6 pt-2 md:grid-cols-2">
						{INITIAL_DIFFICULTY_TIERS.map((tier) => {
							const influence = `${tier.weight}x`;
							const fillCount = tier.weight;
							return (
								<div
									key={tier.id}
									className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
								>
									<div className="flex items-start justify-between px-5 pt-5">
										<div className="rounded-xl bg-[#d7e5f2] px-3 py-2 text-[17px] font-black text-[#3652a3] shadow-sm">{influence}</div>
										<div className="flex items-center gap-3 text-slate-400">
											<PencilLine size={15} />
											<button type="button" className="flex h-5 w-9 items-center rounded-full border border-[#1d7a4d] bg-white px-0.5" aria-label={`Toggle ${tier.name}`}>
												<span className="ml-auto h-3.5 w-3.5 rounded-full bg-[#1d7a4d]" />
											</button>
										</div>
									</div>

									<div className="px-8 pt-8 pb-6">
										<h3 className="text-[18px] font-black text-slate-900">{tier.name}</h3>
										<p className="mt-1.5 text-[13px] leading-5 text-slate-400">{tier.description}</p>
									</div>

									<div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
										<span>Adaptive Influence</span>
										<div className="flex items-center gap-1.5">
											{Array.from({ length: 5 }).map((_, index) => (
												<span
													key={index}
													className={`h-2 w-2 rounded-full ${index < fillCount ? 'bg-[#f5c842]' : 'bg-slate-300'}`}
												/>
											))}
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{showAddTierModal ? (
						<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-sm">
							<div className="relative w-full max-w-[365px] rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 shadow-2xl md:px-5 md:py-5">
								<button
									type="button"
									onClick={() => setShowAddTierModal(false)}
									className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600"
									aria-label="Close new difficulty tier modal"
								>
									<X size={26} strokeWidth={1.5} />
								</button>

								<div className="flex items-center gap-2 pr-10">
									<div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#fbe49a] text-[#1d7a4d] shadow-sm">
										<Layers3 size={14} />
									</div>
									<h3 className="text-[15px] font-black text-[#3652a3]">New Difficulty Tier</h3>
								</div>

								<div className="mt-4 space-y-5">
									<div className="space-y-2">
										<label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Tier Name</label>
										<input
											type="text"
											placeholder="e.g., Professional Evaluation"
											className="h-10 w-full rounded-lg border border-slate-300 bg-slate-200 px-4 text-[13px] font-bold text-slate-700 outline-none placeholder:text-slate-500"
										/>
									</div>

									<div className="space-y-2">
										<label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Drill Level</label>
										<div className="relative">
											<input
												type="number"
												defaultValue={1}
												className="h-11 w-full rounded-lg border border-slate-300 bg-slate-200 px-4 text-[13px] font-bold text-slate-700 outline-none [appearance:textfield]"
											/>
											<div className="pointer-events-none absolute inset-y-0 right-3 flex flex-col items-center justify-center text-slate-500">
												<span className="-mb-1 text-[8px] leading-none">▲</span>
												<span className="text-[8px] leading-none">▼</span>
											</div>
										</div>
									</div>

									<div className="space-y-2">
										<label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Description</label>
										<textarea
											rows={4}
											defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
											className="w-full rounded-lg border border-slate-300 bg-slate-200 px-4 py-3 text-[12px] font-bold leading-5 text-slate-700 outline-none placeholder:text-slate-500"
										/>
									</div>

									<button
										type="button"
										className="mt-1 h-11 w-full rounded-lg bg-[#3652a3] text-[13px] font-black text-white shadow-md transition-transform hover:scale-[1.01]"
									>
										Deploy New Difficulty Tier
									</button>
								</div>
							</div>
						</div>
					) : null}
				</div>
			);
		}

		if (activeTab === 'STRATEGIC') {
			return (
				<div className="space-y-6 pb-8 text-slate-900">
					<section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:p-6">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#3652a3] shadow-sm">
									<BookOpen size={20} />
								</div>
								<div>
									<h1 className="text-[18px] font-black text-slate-900">Subject Management</h1>
									<p className="text-[12px] font-semibold text-slate-400">Manage standard board exam subjects</p>
								</div>
							</div>

							<div className="flex w-full max-w-[430px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
								<div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:w-[250px]">
									<Search size={16} className="text-slate-400" />
									<input
										type="text"
										placeholder="Search curriculum by code or title..."
										className="w-full bg-transparent text-[13px] font-semibold text-slate-700 outline-none placeholder:text-slate-400"
									/>
								</div>

								<button
									type="button"
									onClick={() => setShowAddSubjectModal(true)}
									className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3652a3] px-4 text-[13px] font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.1)]"
								>
									<Plus size={16} />
									Add Subject
								</button>
							</div>
						</div>

						<div className="mt-5 grid gap-3 md:grid-cols-3">
							{MOCK_SUBJECTS.map((subject, index) => (
								<div key={subject.id} className="rounded-[1.4rem] bg-[#f2ecec] p-3 shadow-[0_4px_10px_rgba(15,23,42,0.05)]">
									<div className="rounded-xl bg-[#cbe1e7] px-4 py-3 shadow-[0_4px_10px_rgba(15,23,42,0.12)]">
										<div className="flex items-start justify-between gap-3">
											<div>
												<div className="inline-flex rounded-full bg-[#d7e5f2] px-2.5 py-1 text-[12px] font-black uppercase tracking-tight text-[#3652a3] shadow-sm">
													{subject.code}
												</div>
												<h3 className="mt-2 text-[13px] font-black leading-5 text-slate-900">{subject.name}</h3>
											</div>
											{index === 0 ? (
												<div className="flex items-center gap-3 text-slate-400">
													<PencilLine size={14} />
													<button type="button" className="flex h-5 w-9 items-center rounded-full border border-[#1d7a4d] bg-white px-0.5" aria-label="Toggle subject status">
														<span className="ml-auto h-3.5 w-3.5 rounded-full bg-[#1d7a4d]" />
													</button>
												</div>
											) : null}
										</div>
									</div>
								</div>
							))}
						</div>
					</section>

					{showAddSubjectModal ? (
						<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
							<div className="relative w-full max-w-[375px] rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 shadow-2xl md:px-5 md:py-5">
								<button
									type="button"
									onClick={() => setShowAddSubjectModal(false)}
									className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600"
									aria-label="Close add subject modal"
								>
									<X size={26} strokeWidth={1.5} />
								</button>

								<div className="pr-10">
									<h3 className="text-[16px] font-black text-[#3652a3]">Add New Subject</h3>
								</div>

								<div className="mt-4 space-y-4">
									<div className="space-y-2">
										<label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Subject Code</label>
										<input
											type="text"
											placeholder="e.g., FAR,TAX,AFAR"
											className="h-10 w-full rounded-lg border border-slate-300 bg-slate-200 px-4 text-[13px] font-bold text-slate-700 outline-none placeholder:text-slate-500"
										/>
									</div>

									<div className="space-y-2">
										<label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Subject Name</label>
										<input
											type="text"
											placeholder="Full name of the board subject"
											className="h-10 w-full rounded-lg border border-slate-300 bg-slate-200 px-4 text-[13px] font-bold text-slate-700 outline-none placeholder:text-slate-500"
										/>
									</div>

									<button
										type="button"
										className="h-11 w-full rounded-lg bg-[#1d7a4d] text-[13px] font-black text-white shadow-md transition-transform hover:scale-[1.01]"
									>
										Create Subject Entry
									</button>
								</div>
							</div>
						</div>
					) : null}

					{showAddSectionModal ? (
									<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
										<div className="relative w-full max-w-[375px] rounded-[1.1rem] border border-slate-200 bg-white px-4 py-4 shadow-2xl md:px-5 md:py-5">
											<button
												type="button"
												onClick={() => setShowAddSectionModal(false)}
												className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600"
												aria-label="Close add sections modal"
											>
												<X size={26} strokeWidth={1.5} />
											</button>

											<div className="pr-10">
												<h3 className="text-[16px] font-black text-[#3652a3]">Add New Sections</h3>
											</div>

											<div className="mt-5 space-y-4">
												<div className="space-y-2">
													<label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Section Name</label>
													<input
														type="text"
														placeholder="e.g., BSBA-M1"
														className="h-10 w-full rounded-lg border border-slate-300 bg-slate-200 px-4 text-[13px] font-bold text-slate-700 outline-none placeholder:text-slate-500"
													/>
												</div>

												<button
													type="button"
													className="h-11 w-full rounded-lg bg-[#1d7a4d] text-[13px] font-black text-white shadow-md transition-transform hover:scale-[1.01]"
												>
													Create Section Entry
												</button>
											</div>
										</div>
									</div>
								) : null}

					<section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:p-6">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex items-start gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#3652a3] shadow-sm">
									<Layers3 size={20} />
								</div>
								<div>
									<h1 className="text-[18px] font-black text-slate-900">Sections Management</h1>
									<p className="text-[12px] font-semibold text-slate-400">Manage class sections to assign</p>
								</div>
							</div>

							<div className="flex w-full max-w-[430px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
								<div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:w-[250px]">
									<Search size={16} className="text-slate-400" />
									<input
										type="text"
										placeholder="Search"
										className="w-full bg-transparent text-[13px] font-semibold text-slate-700 outline-none placeholder:text-slate-400"
									/>
								</div>

								<button
									type="button"
									onClick={() => setShowAddSectionModal(true)}
									className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3652a3] px-4 text-[13px] font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.1)]"
								>
									<Plus size={16} />
									Add Sections
								</button>
							</div>
						</div>

						<div className="mt-5 grid gap-3 md:grid-cols-3">
							{[
								'BSBA - M1',
								'BSBA - M2',
								'BSBA - M3',
								'BSBA - M4',
								'BSBA - M5',
								'BSBA - M6',
							].map((section, index) => (
								<div key={section} className="rounded-[1.4rem] bg-[#f2ecec] p-3 shadow-[0_4px_10px_rgba(15,23,42,0.05)]">
									<div className="rounded-xl bg-[#cbe1e7] px-4 py-4 shadow-[0_4px_10px_rgba(15,23,42,0.12)]">
										<div className="flex items-start justify-between gap-3">
											<div className="text-[13px] font-black text-[#3652a3]">{section}</div>
											{index === 0 ? (
												<div className="flex items-center gap-3 text-slate-400">
													<PencilLine size={14} />
													<button type="button" className="flex h-5 w-9 items-center rounded-full border border-[#1d7a4d] bg-white px-0.5" aria-label="Toggle section status">
														<span className="ml-auto h-3.5 w-3.5 rounded-full bg-[#1d7a4d]" />
													</button>
												</div>
											) : null}
										</div>
									</div>
								</div>
							))}
						</div>
					</section>
				</div>
			);
		}

		if (activeTab === 'ANNOUNCEMENTS') {
			return (
				<div className="space-y-6 pb-8 text-slate-900">
					<section className="relative overflow-hidden rounded-[2rem] bg-[#3652a3] px-5 py-5 text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)] md:px-6 md:py-6">
						<div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
							<div className="max-w-xl space-y-3">
								<h1 className="text-[28px] font-black tracking-tight md:text-[30px]">Announcements</h1>
								<p className="max-w-lg text-[15px] leading-5 text-blue-100/85">
									Post and manage system-wide notices for students, faculty, or staff.
								</p>
							</div>

							<button
								type="button"
								onClick={() => setShowComposeAnnouncementModal(true)}
								className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#f5c842] px-5 text-[15px] font-black text-[#1d7a4d] shadow-[0_6px_0_rgba(0,0,0,0.12)] transition-transform hover:translate-y-0.5"
							>
								<Plus size={18} />
								New Announcement
							</button>
						</div>

						<div className="pointer-events-none absolute right-3 top-1 h-36 w-36 rounded-full border-[12px] border-white/10 md:right-5 md:top-0 md:h-40 md:w-40" />
						<div className="pointer-events-none absolute right-12 top-8 h-24 w-24 rounded-full border-[12px] border-white/10 md:right-16 md:top-10 md:h-28 md:w-28" />
						<div className="pointer-events-none absolute right-6 top-12 opacity-10">
							<Layers3 size={110} />
						</div>
					</section>

					<div className="rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
						<div className="flex items-start gap-3">
							<div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#3652a3]">
								<span>Admin</span>
							</div>
							<span className="pt-0.5 text-[11px] font-black text-slate-400">1/01/2026</span>
						</div>
						<div className="mt-3 space-y-1">
							<h3 className="text-[16px] font-black text-slate-900">Lorem ipsum</h3>
							<p className="text-[13px] leading-5 text-slate-700">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
							<p className="pt-3 text-[12px] font-bold text-slate-500">by Admin User</p>
						</div>
					</div>

					{showComposeAnnouncementModal ? (
						<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
							<div className="w-full max-w-[420px] rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl md:p-8">
								<div className="flex items-start justify-between gap-4">
									<div className="flex items-center gap-3">
										<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5c842] text-[#1d7a4d] shadow-sm">
											<ShieldCheck size={20} />
										</div>
										<h3 className="text-[22px] font-black text-[#1e3a8a]">New Announcement</h3>
									</div>
									<button
										type="button"
										onClick={() => setShowComposeAnnouncementModal(false)}
										className="text-slate-400 transition-colors hover:text-slate-600"
										aria-label="Close announcement modal"
									>
										<X size={28} />
									</button>
								</div>

								<div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-[#1e3a8a]">
									This announcement will be sent to all Students, Faculty, and Staff.
								</div>

								<div className="mt-6 space-y-4">
									<input
										type="text"
										placeholder="Title"
										className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] font-bold text-slate-800 outline-none placeholder:text-slate-400"
									/>
									<textarea
										rows={5}
										placeholder="Write your announcement..."
										className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-[13px] leading-6 text-slate-800 outline-none placeholder:text-slate-400"
									/>
									<button
										type="button"
										className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1e3a8a] text-[13px] font-black text-white shadow-xl shadow-blue-900/15 transition-transform hover:scale-[1.01]"
									>
										<Plus size={16} />
										Post Announcement
									</button>
								</div>
							</div>
						</div>
					) : null}
				</div>
			);
		}

		if (activeTab === 'LEADERBOARD') {
			return (
				<div className="space-y-6 pb-8 text-slate-900">
					<section className="relative overflow-hidden rounded-[2rem] bg-[#3652a3] px-6 py-6 text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)] md:px-8 md:py-7">
						<div className="relative z-10 flex items-center justify-between gap-4">
							<h1 className="text-[28px] font-black tracking-tight md:text-[30px]">Student Leaderboard</h1>
							<div className="hidden text-white/30 lg:block">
								<Trophy size={104} strokeWidth={1.4} />
							</div>
						</div>
					</section>

					<div className="mx-auto w-full max-w-[760px] rounded-[0.35rem] border border-[#3652a3] bg-[#3652a3] p-1.5 shadow-[0_6px_0_rgba(0,0,0,0.08)]">
						<div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
							<div className="flex overflow-hidden rounded-md bg-[#3652a3] text-[14px] font-black">
								<button
									type="button"
									onClick={() => setLeaderboardView('GLOBAL')}
									className={`px-6 py-3 transition-colors ${leaderboardView === 'GLOBAL' ? 'bg-[#f5c842] text-[#1d7a4d]' : 'text-white/55'}`}
								>
									Global
								</button>
								<button
									type="button"
									onClick={() => setLeaderboardView('PASSED')}
									className={`px-6 py-3 transition-colors ${leaderboardView === 'PASSED' ? 'bg-[#f5c842] text-[#1d7a4d]' : 'text-white/55'}`}
								>
									Passed
								</button>
							</div>

							<div className="grid flex-1 gap-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-white lg:grid-cols-[1.15fr_1fr_1.3fr] lg:items-center">
								<div className="space-y-1">
									<label className="block text-white">Subjects</label>
									<select className="h-9 w-full rounded-sm border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-900 outline-none">
										<option>All Subjects</option>
										<option>FAR</option>
										<option>AFAR</option>
										<option>MAS</option>
										<option>TAX</option>
										<option>RFBT</option>
										<option>AUD</option>
									</select>
								</div>

								<div className="space-y-1">
									<label className="block text-white">Difficulty</label>
									<select className="h-9 w-full rounded-sm border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-900 outline-none">
										<option>All Levels</option>
										<option>Easy</option>
										<option>Average</option>
										<option>Difficult</option>
									</select>
								</div>

								<div className="space-y-1">
									<label className="block text-white">Date</label>
									<div className="flex items-center gap-2">
										<input type="date" className="h-9 min-w-0 flex-1 rounded-sm border border-slate-200 bg-white px-2 text-[11px] font-black text-slate-900 outline-none" />
										<span className="text-[11px] font-black tracking-widest text-white">TO</span>
										<input type="date" className="h-9 min-w-0 flex-1 rounded-sm border border-slate-200 bg-white px-2 text-[11px] font-black text-slate-900 outline-none" />
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<table className="w-full border-separate border-spacing-0 text-sm">
							<thead>
								<tr className="border-b border-slate-100 bg-white">
									<th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Rank</th>
									<th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Student</th>
									<th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Student ID</th>
									<th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Avg Accuracy</th>
									<th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Sessions</th>
								</tr>
							</thead>
							<tbody>
								{leaderboardRows.map((row) => (
									<tr key={row.studentId} className="border-t border-slate-100">
										<td className="px-6 py-4">
											<div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-black ${row.rank === 1 ? 'border-amber-200 bg-amber-100 text-amber-700' : row.rank === 2 ? 'border-slate-300 bg-slate-200 text-slate-700' : row.rank === 3 ? 'border-orange-200 bg-orange-100 text-orange-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
												{row.rank <= 3 ? <Trophy size={14} /> : row.rank}
											</div>
										</td>
										<td className="px-6 py-4 text-[12px] font-black text-slate-900">student</td>
										<td className="px-6 py-4 text-[11px] font-black tracking-[0.12em] text-slate-500">{row.studentId}</td>
										<td className="px-6 py-4 text-right text-[13px] font-black text-slate-900">{row.accuracy}%</td>
										<td className="px-6 py-4 text-right text-[13px] font-black text-slate-900">{row.sessions}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			);
		}

		return (
			<div className="space-y-6 pb-8">
				<Panel
					title={
						activeTab === 'FACULTY'
							? 'Faculty Management'
							: activeTab === 'DIFFICULTIES'
								? 'Difficulty Tiers'
								: activeTab === 'STRATEGIC'
									? 'Curriculum Management'
									: 'Dashboard'
					}
					subtitle="Core admin controls remain available here while the analytics dashboard sits on the main view."
					icon={activeTab === 'FACULTY' ? Users : activeTab === 'DIFFICULTIES' ? Layers3 : ShieldCheck}
				>
					<div className="grid gap-4 md:grid-cols-3">
						{activeTab === 'FACULTY'
							? DEMO_USERS.filter((user) => user.role === UserRole.FACULTY).map((user) => (
									<div key={user.email} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="font-black text-slate-900">{user.name}</p>
												<p className="text-xs font-semibold text-slate-500">{user.email}</p>
											</div>
											<span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
												Active
											</span>
										</div>
									</div>
								))
							: null}

						{activeTab === 'DIFFICULTIES'
							? INITIAL_DIFFICULTY_TIERS.map((tier) => (
									<div key={tier.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
										<p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Weight {tier.weight}</p>
										<p className="mt-1 font-black text-slate-900">{tier.name}</p>
										<p className="mt-2 text-sm leading-6 text-slate-500">{tier.description}</p>
									</div>
								))
							: null}

						{activeTab === 'STRATEGIC'
							? MOCK_SUBJECTS.map((subject) => (
									<div key={subject.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
										<p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{subject.code}</p>
										<p className="mt-1 font-black text-slate-900">{subject.name}</p>
									</div>
								))
							: null}
					</div>
				</Panel>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-8 text-slate-900">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
					<CalendarDays size={16} className="text-slate-400" />
					<input
						type="date"
						defaultValue=""
						className="w-[120px] bg-transparent text-[11px] font-black uppercase tracking-widest text-slate-500 outline-none"
					/>
					<span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">TO</span>
					<input
						type="date"
						defaultValue=""
						className="w-[120px] bg-transparent text-[11px] font-black uppercase tracking-widest text-slate-500 outline-none"
					/>
				</div>

				<button
					type="button"
					onClick={exportData}
					className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-900/15 transition-transform hover:scale-[1.01]"
				>
					<Download size={14} />
					Export Data
				</button>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{stats.map((stat) => (
					<StatCard key={stat.label} {...stat} />
				))}
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
				<Panel
					title="Historical Trend Line"
					subtitle="Accuracy and passing likelihood for 2022, 2023, and 2024, and current batch"
					icon={ArrowUpRight}
					className="xl:col-span-3"
				>
					<div className="h-[320px]">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={trendData} margin={{ top: 10, right: 20, left: -4, bottom: 0 }}>
								<CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
								<XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
								<YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={formatPercent} />
								<Tooltip formatter={(value: number) => [`${value}%`, '']} labelStyle={{ color: '#0f172a', fontWeight: 800 }} />
								<Legend wrapperStyle={{ fontSize: 12, fontWeight: 800, color: '#64748b' }} />
								<Line type="monotone" dataKey="passingLikelihood" name="Passing Likelihood" stroke="#3652a3" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
								<Line type="monotone" dataKey="averageAccuracy" name="Average Accuracy" stroke="#0f9d58" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</Panel>

				<Panel
					title="Global Readiness Gauge"
					icon={Gauge}
					action={
						<span className="rounded-lg bg-emerald-700 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-sm">
							Download PDF
						</span>
					}
					className="xl:col-span-2"
				>
					<div className="flex flex-col items-center justify-center gap-4">
						<div className="relative h-[210px] w-full max-w-[270px]">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={gaugeData}
										startAngle={180}
										endAngle={0}
										innerRadius={72}
										outerRadius={96}
										paddingAngle={1}
										dataKey="value"
									>
										<Cell fill="#10b981" />
										<Cell fill="#d1d5db" />
									</Pie>
								</PieChart>
							</ResponsiveContainer>
							<div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center justify-center text-center">
								<p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Board Passing Likelihood</p>
								<p className="mt-1 text-2xl font-black text-[#3652a3]">50.0%</p>
							</div>
						</div>
						<p className="max-w-[220px] text-center text-[11px] font-bold leading-5 text-slate-900">
							Board Passing Likelihood = (Pass Rate x 0.50) + (Average Accuracy x 0.35) + (Completion Rate x 0.15)
						</p>
					</div>
				</Panel>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<Panel title="Subject Performance Radar" icon={Target}>
					<div className="h-[320px]">
						<ResponsiveContainer width="100%" height="100%">
							<RadarChart data={radarData} outerRadius="70%">
								<PolarGrid stroke="#fde68a" />
								<PolarAngleAxis dataKey="subject" tick={{ fill: '#b4b4b4', fontSize: 11, fontWeight: 700 }} />
								<PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
								<RadarSeries dataKey="value" stroke="#a1a1aa" fill="#9ca3af" fillOpacity={0.82} />
							</RadarChart>
						</ResponsiveContainer>
					</div>
				</Panel>

				<Panel title="Weekly Engagement" icon={Activity}>
					<div className="h-[320px]">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={weeklyEngagement} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
								<defs>
									<linearGradient id="engagementFill" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#3652a3" stopOpacity={0.42} />
										<stop offset="95%" stopColor="#3652a3" stopOpacity={0.04} />
									</linearGradient>
								</defs>
								<CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
								<XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
								<YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
								<Tooltip labelStyle={{ color: '#0f172a', fontWeight: 800 }} />
								<Area type="monotone" dataKey="value" stroke="#3652a3" strokeWidth={2.5} fill="url(#engagementFill)" />
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</Panel>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<Panel title="Faculty Efficiency Analysis" icon={BarChart3}>
					<div className="h-[320px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={facultyEfficiency} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
								<CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={false} />
								<XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
								<YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
								<Tooltip formatter={(value: number) => [`${value}%`, 'Readiness']} labelStyle={{ color: '#0f172a', fontWeight: 800 }} />
								<Legend />
								<Bar dataKey="score" name="Readiness Score (%)" radius={[6, 6, 0, 0]}>
									{facultyEfficiency.map((entry) => (
										<Cell key={entry.name} fill={entry.risk ? '#ef4444' : '#3652a3'} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</Panel>

				<Panel title="Question Bank Analysis" icon={BookOpen}>
					<div className="space-y-4">
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => setActiveTab('ITEM_ANALYSIS')}
								className="rounded-lg bg-[#3652a3] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
							>
								View Detailed Reports
							</button>
							<button
								type="button"
								onClick={() => setShowDifficultyReports(true)}
								className="rounded-lg bg-[#3652a3] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
							>
								View Difficulty Reports
							</button>
						</div>
						<div className="space-y-4 pt-1">
							{questionBankAnalysis.map((item) => (
								<div key={item.code} className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-xs font-black tracking-widest text-slate-700">{item.code}</span>
										<span className="text-sm font-black" style={{ color: item.color }}>
											{item.score}%
										</span>
									</div>
									<div className="h-2 rounded-full bg-slate-200">
										<div
											className="h-2 rounded-full"
											style={{ width: `${item.score}%`, backgroundColor: item.color }}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				</Panel>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<Panel title="Subject Efficiency Analysis" icon={ArrowUpRight}>
					<div className="h-[320px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={subjectEfficiency} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
								<CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={false} />
								<XAxis dataKey="code" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
								<YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
								<Tooltip formatter={(value: number) => [`${value}%`, '']} labelStyle={{ color: '#0f172a', fontWeight: 800 }} />
								<Legend />
								<Bar dataKey="blue" name="Readiness Score (%)" fill="#3652a3" radius={[6, 6, 0, 0]} />
								<Bar dataKey="red" name="At-Risk" fill="#ef4444" radius={[6, 6, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</Panel>

				<Panel title="Section Readiness Comparison" icon={ArrowUpRight}>
					<div className="h-[320px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={sectionReadiness} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
								<CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={false} />
								<XAxis dataKey="code" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
								<YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
								<Tooltip formatter={(value: number) => [`${value}%`, '']} labelStyle={{ color: '#0f172a', fontWeight: 800 }} />
								<Legend />
								<Bar dataKey="blue" name="Readiness Score (%)" fill="#3652a3" radius={[6, 6, 0, 0]} />
								<Bar dataKey="red" name="At-Risk" fill="#ef4444" radius={[6, 6, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</Panel>
			</div>

			{showDifficultyReports ? (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
					<div className="relative w-full max-w-[380px] rounded-sm border border-slate-200 bg-white p-6 shadow-2xl">
						<button
							type="button"
							onClick={() => setShowDifficultyReports(false)}
							className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600"
							aria-label="Close difficulty reports"
						>
							<span className="text-4xl leading-none">×</span>
						</button>

						<div className="flex items-start gap-3 pr-8">
							<div className="mt-1 text-[#facc15]">
								<BarChart3 size={18} />
							</div>
							<h3 className="text-[15px] font-black leading-5 text-slate-900">Question Bank Difficulty Distribution</h3>
						</div>

						<div className="mt-10 space-y-10">
							{[
								{ label: 'Recall (Easy)', value: 82 },
								{ label: 'Application (Average)', value: 70 },
								{ label: 'Evaluation (Difficult)', value: 42 },
							].map((item) => (
								<div key={item.label} className="grid grid-cols-[92px_1fr] items-center gap-3">
									<div className="text-[10px] font-black leading-4 text-slate-900">{item.label}</div>
									<div className="h-4 rounded-full bg-slate-200">
										<div
											className="h-4 rounded-full bg-[#3652a3]"
											style={{ width: `${item.value}%` }}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			) : null}

			{selectedStudent ? (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
					<div className="w-full max-w-[780px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
						<div className="flex items-start justify-between gap-4 p-5 md:p-6">
							<div className="flex items-start gap-4">
								<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-300 bg-white text-3xl font-black text-[#3652a3] shadow-[0_4px_18px_rgba(15,23,42,0.08)]">
									{selectedStudent.name.charAt(0)}
								</div>
								<div className="pt-1">
									<p className="text-sm font-black text-slate-700">{selectedStudent.studentId}</p>
									<p className="text-[13px] font-bold text-slate-600">Section: {selectedStudent.section}</p>
									<p className="text-[13px] font-bold text-slate-600">Batch: {selectedStudent.batch}</p>
									<p className="text-[13px] font-semibold text-slate-400">{selectedStudent.email}</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setSelectedStudent(null)}
								className="text-slate-400 transition-colors hover:text-slate-600"
								aria-label="Close student report"
							>
								<X size={34} strokeWidth={1.5} />
							</button>
						</div>

						<div className="grid gap-3 px-5 pb-5 md:grid-cols-3 md:px-6">
							<div className="rounded-xl border border-slate-200 p-4 md:p-5">
								<h3 className="text-xl font-black text-slate-900">Accuracy Rate</h3>
								<div className="mt-3 flex items-center justify-center">
									<div className="relative h-[150px] w-[150px]">
										<ResponsiveContainer width="100%" height="100%">
											<PieChart>
												<Pie
													data={[
														{ name: 'score', value: selectedStudent.accuracy },
														{ name: 'rest', value: 100 - selectedStudent.accuracy },
													]}
													startAngle={90}
													endAngle={-270}
													innerRadius={46}
													outerRadius={64}
													paddingAngle={0}
													dataKey="value"
												>
													<Cell fill="#10b981" />
													<Cell fill="#d1d5db" />
												</Pie>
											</PieChart>
										</ResponsiveContainer>
										<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
											<p className="text-[32px] font-black text-slate-900">{selectedStudent.accuracy}%</p>
										</div>
									</div>
								</div>
							</div>

							<div className="rounded-xl border border-slate-200 p-4 md:p-5">
								<h3 className="text-xl font-black text-slate-900">Weakest Subject</h3>
								<div className="mt-6 flex h-[92px] items-center justify-center rounded-2xl bg-[#f7c3c3] text-2xl font-black text-red-600">
									{selectedStudent.weakestSubject}
								</div>
							</div>

							<div className="rounded-xl border border-slate-200 p-4 md:p-5">
								<div className="grid grid-cols-3 gap-3 text-center">
									<div>
										<h3 className="text-2xl font-black text-slate-900">Attempts</h3>
										<p className="mt-8 text-[30px] font-black text-[#3652a3]">{selectedStudent.attempts}</p>
									</div>
									<div>
										<h3 className="text-2xl font-black text-slate-900">Correct</h3>
										<p className="mt-8 text-[30px] font-black text-emerald-700">{selectedStudent.correct}</p>
									</div>
									<div>
										<h3 className="text-2xl font-black text-slate-900">Wrong</h3>
										<p className="mt-8 text-[30px] font-black text-red-600">{selectedStudent.wrong}</p>
									</div>
								</div>
							</div>
						</div>

						<div className="px-5 pb-5 md:px-6">
							<div className="rounded-xl border border-slate-200 p-4 md:p-5">
								<div className="mb-4 flex items-center justify-between gap-4">
									<h3 className="text-[15px] font-black text-slate-900">Performance Over Time</h3>
									<span className="rounded-full bg-emerald-700 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">
										+12% Improvement
									</span>
								</div>
								<div className="h-[250px]">
									<ResponsiveContainer width="100%" height="100%">
										<LineChart data={selectedStudent.performance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
											<CartesianGrid stroke="#e5e7eb" />
											<XAxis dataKey="week" tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
											<YAxis tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
											<Tooltip labelStyle={{ color: '#0f172a', fontWeight: 800 }} />
											<Line type="monotone" dataKey="score" stroke="#1d7a4d" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
										</LineChart>
									</ResponsiveContainer>
								</div>
							</div>
						</div>

						<div className="px-5 pb-5 md:px-6">
							<div className="rounded-xl border border-slate-200 p-4 md:p-5">
								<h3 className="text-[15px] font-black text-slate-900">Drill History</h3>
								<div className="mt-4 space-y-3">
									{selectedStudent.drillHistory.map((item) => (
										<div key={`${item.subject}-${item.date}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
											<div>
												<p className="text-sm font-black text-slate-800">{item.subject}</p>
												<p className="text-xs font-semibold text-slate-400">{item.date}</p>
											</div>
											<div className="text-right">
												<p className="text-sm font-black text-[#3652a3]">{item.score}</p>
												<p className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'Passed' ? 'text-emerald-600' : 'text-red-600'}`}>{item.status}</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			) : null}

			<Panel title="Students Performance Overview" icon={Trophy}>
				<div className="overflow-x-auto">
					<table className="min-w-full border-separate border-spacing-0">
						<thead>
							<tr className="bg-slate-100/90 text-left">
								{['Student Name', 'Email', 'Accuracy', 'Weakest Subject', 'Status', 'Action'].map((heading) => (
									<th key={heading} className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
										{heading}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{students.map((student) => (
								<tr key={`${student.email}-${student.accuracy}`} className="border-t border-slate-100">
									<td className="px-5 py-5 text-sm font-black text-slate-900">{student.name}</td>
									<td className="px-5 py-5 text-sm font-semibold text-slate-600">{student.email}</td>
									<td className="px-5 py-5">
										<div className="flex items-center gap-3">
											<div className="h-2 w-20 rounded-full bg-slate-200">
												<div
													className={`h-2 rounded-full ${student.accuracy >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`}
													style={{ width: `${student.accuracy}%` }}
												/>
											</div>
											<span className="text-xs font-black text-slate-700">{student.accuracy}%</span>
										</div>
									</td>
									<td className="px-5 py-5">
										<span className="rounded-full bg-slate-300 px-4 py-2 text-xs font-black text-[#3652a3]">{student.weakestSubject}</span>
									</td>
									<td className="px-5 py-5">
										<span
											className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest ${
												getStudentStatus(student.accuracy) === 'PASSED'
													? 'bg-emerald-400/80 text-emerald-900'
													: 'bg-red-300 text-red-700'
											}`}
										>
											{getStudentStatus(student.accuracy)}
										</span>
									</td>
									<td className="px-5 py-5">
										<button
											type="button"
											onClick={() => setSelectedStudent(student)}
											className="rounded-xl bg-[#3652a3] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-sm"
										>
											View History
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Panel>
		</div>
	);
};

export default AdminDashboard;

export const LANGS = ['en', 'id'] as const;
export type Lang = (typeof LANGS)[number];

export const dict = {
  en: {
    appName: 'BBB CRM',
    tagline: 'A simple CRM for small business owners.',

    // Auth
    login: 'Log in',
    signup: 'Sign up',
    logout: 'Log out',
    email: 'Email',
    password: 'Password',
    businessName: 'Business name',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    loginCta: 'Log in',
    signupCta: 'Create account',
    checkEmail: 'Check your email to confirm your account, then log in.',
    forgotPassword: 'Forgot password?',
    forgotPasswordTitle: 'Reset your password',
    forgotPasswordHint: "Enter your email and we'll send you a link to set a new password.",
    sendResetLink: 'Send reset link',
    resetLinkSent: 'Check your email for the reset link.',
    resetPasswordTitle: 'Set a new password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    passwordsDoNotMatch: 'Passwords do not match.',
    passwordUpdated: 'Password updated. You can now log in.',
    backToLogin: '← Back to log in',
    verifyingLink: 'Verifying the link…',
    invalidResetLink: 'This link is invalid or has expired. Please request a new one.',

    // Captcha
    captchaRequired: 'Please complete the verification.',

    // Nav
    home: 'Home',
    customers: 'Customers',
    addCustomer: 'Add customer',
    add: 'Add',

    // Dashboard
    totalCustomers: 'Total customers',
    dormant30: 'Quiet for 30+ days',
    birthdaysToday: "Today's birthdays",
    welcome: 'Welcome',
    quickActions: 'Quick actions',

    // Customer list
    searchPlaceholder: 'Search by name or phone',
    noCustomersYet: "No customers yet. Tap '+' to add your first one.",
    noResults: 'No matches.',

    // Customer form
    name: 'Name',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone (WhatsApp)',
    birthday: 'Birthday',
    tags: 'Tags',
    notes: 'Notes',
    save: 'Save',
    cancel: 'Cancel',
    saving: 'Saving…',
    required: 'Required',
    newTagPlaceholder: 'New tag…',
    removeTag: 'Remove',
    noTagsYet: 'No tags yet — add your first.',
    exportCsv: 'Export CSV',

    // Customer detail
    timeline: 'History',
    noInteractionsYet: 'No history yet.',
    logInteraction: 'Log a visit',
    kind: 'What happened',
    visitKind: 'Visit',
    callKind: 'Call',
    saleKind: 'Sale',
    messageKind: 'Message',
    otherKind: 'Other',
    amount: 'Amount (optional)',
    occurredAt: 'When',
    today: 'today',
    yesterday: 'yesterday',
    daysAgo: '{n} days ago',
    openWhatsApp: 'WhatsApp',
    deleteCustomer: 'Delete customer',
    confirmDelete: 'Delete this customer and all their history?',

    // Status / pipeline
    status: 'Status',
    statusCold: 'Cold',
    statusWarm: 'Warm',
    statusHot: 'Hot',
    statusDealDone: 'Deal done',
    statusPaused: 'Paused',
    pipeline: 'Pipeline',
    allStatuses: 'All',
    changeStatus: 'Change status',

    // Lifetime value
    lifetimeValue: 'Lifetime value',
    ltvShort: 'LTV',
    totalCustomersLtv: 'Total spent',

    // Misc
    loading: 'Loading…',
    error: 'Something went wrong.',
  },
  id: {
    appName: 'BBB CRM',
    tagline: 'CRM sederhana untuk pemilik usaha kecil.',

    login: 'Masuk',
    signup: 'Daftar',
    logout: 'Keluar',
    email: 'Email',
    password: 'Kata sandi',
    businessName: 'Nama usaha',
    noAccount: 'Belum punya akun?',
    haveAccount: 'Sudah punya akun?',
    loginCta: 'Masuk',
    signupCta: 'Buat akun',
    checkEmail: 'Cek email kamu untuk konfirmasi akun, lalu masuk.',
    forgotPassword: 'Lupa kata sandi?',
    forgotPasswordTitle: 'Reset kata sandi',
    forgotPasswordHint: 'Masukin email kamu, nanti kami kirim link buat bikin kata sandi baru.',
    sendResetLink: 'Kirim link reset',
    resetLinkSent: 'Cek email kamu untuk link reset.',
    resetPasswordTitle: 'Bikin kata sandi baru',
    newPassword: 'Kata sandi baru',
    confirmPassword: 'Konfirmasi kata sandi baru',
    passwordsDoNotMatch: 'Kata sandi tidak cocok.',
    passwordUpdated: 'Kata sandi sudah diperbarui. Silakan masuk.',
    backToLogin: '← Kembali ke halaman masuk',
    verifyingLink: 'Memverifikasi link…',
    invalidResetLink: 'Link ini tidak valid atau sudah kedaluwarsa. Silakan minta link baru.',

    // Captcha
    captchaRequired: 'Mohon selesaikan verifikasi.',

    home: 'Beranda',
    customers: 'Customer',
    addCustomer: 'Tambah customer',
    add: 'Tambah',

    totalCustomers: 'Total customer',
    dormant30: 'Sudah 30+ hari nggak kontak',
    birthdaysToday: 'Ulang tahun hari ini',
    welcome: 'Halo',
    quickActions: 'Aksi cepat',

    searchPlaceholder: 'Cari nama atau nomor',
    noCustomersYet: "Belum ada customer. Tap '+' untuk tambah yang pertama.",
    noResults: 'Tidak ada hasil.',

    name: 'Nama',
    firstName: 'Nama depan',
    lastName: 'Nama belakang',
    phone: 'Nomor (WhatsApp)',
    birthday: 'Tanggal lahir',
    tags: 'Tag',
    notes: 'Catatan',
    save: 'Simpan',
    cancel: 'Batal',
    saving: 'Menyimpan…',
    required: 'Wajib diisi',
    newTagPlaceholder: 'Tag baru…',
    removeTag: 'Hapus',
    noTagsYet: 'Belum ada tag — tambahkan yang pertama.',
    exportCsv: 'Export CSV',

    timeline: 'Riwayat',
    noInteractionsYet: 'Belum ada riwayat.',
    logInteraction: 'Catat kunjungan',
    kind: 'Kegiatan',
    visitKind: 'Kunjungan',
    callKind: 'Telepon',
    saleKind: 'Penjualan',
    messageKind: 'Chat',
    otherKind: 'Lainnya',
    amount: 'Nominal (opsional)',
    occurredAt: 'Kapan',
    today: 'hari ini',
    yesterday: 'kemarin',
    daysAgo: '{n} hari lalu',
    openWhatsApp: 'WhatsApp',
    deleteCustomer: 'Hapus customer',
    confirmDelete: 'Hapus customer ini beserta seluruh riwayatnya?',

    // Status / pipeline
    status: 'Status',
    statusCold: 'Dingin',
    statusWarm: 'Hangat',
    statusHot: 'Panas',
    statusDealDone: 'Sudah deal',
    statusPaused: 'Pause',
    pipeline: 'Pipeline',
    allStatuses: 'Semua',
    changeStatus: 'Ubah status',

    // Lifetime value
    lifetimeValue: 'Total belanja',
    ltvShort: 'LTV',
    totalCustomersLtv: 'Total spending',

    loading: 'Memuat…',
    error: 'Terjadi kesalahan.',
  },
} as const;

export type DictKey = keyof typeof dict.en;

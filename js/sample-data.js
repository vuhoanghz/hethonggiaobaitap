/**
 * Dữ liệu mẫu khởi tạo cho EduAssign Portal (v3.0)
 * Hỗ trợ: Hệ thống Tài khoản & Mật khẩu (Chỉ Giáo viên có quyền cấp tài khoản học sinh)
 */

function generateSampleAccounts() {
    return [
        {
            id: 'acc_teacher_1',
            username: 'giaovien',
            password: '123',
            fullName: 'Thầy Nguyễn Văn An',
            role: 'teacher',
            subject: 'Toán học & Chủ nhiệm 12A1',
            createdAt: '2026-09-01T08:00:00.000Z'
        },
        {
            id: 'acc_student_1',
            username: 'hs_khang',
            password: '123',
            fullName: 'Nguyễn Minh Khang',
            className: '12A1',
            role: 'student',
            createdAt: '2026-09-05T08:00:00.000Z'
        },
        {
            id: 'acc_student_2',
            username: 'hs_phuong',
            password: '123',
            fullName: 'Trần Thị Mai Phương',
            className: '12A1',
            role: 'student',
            createdAt: '2026-09-05T08:05:00.000Z'
        },
        {
            id: 'acc_student_3',
            username: 'hs_nam',
            password: '123',
            fullName: 'Lê Hoàng Nam',
            className: '12A1',
            role: 'student',
            createdAt: '2026-09-05T08:10:00.000Z'
        },
        {
            id: 'acc_student_4',
            username: 'hs_duc',
            password: '123',
            fullName: 'Trần Minh Đức',
            className: '12A1',
            role: 'student',
            createdAt: '2026-09-05T08:15:00.000Z'
        },
        {
            id: 'acc_student_5',
            username: 'hs_khoa',
            password: '123',
            fullName: 'Phạm Đăng Khoa',
            className: '11B2',
            role: 'student',
            createdAt: '2026-09-05T08:20:00.000Z'
        }
    ];
}

function generateSampleData() {
    const now = new Date();

    // Bài 1: Đang mở (còn 3 tiếng)
    const due1 = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    // Bài 2: Sắp hết hạn (còn 20 phút)
    const due2 = new Date(now.getTime() + 20 * 60 * 1000);
    // Bài 3: Đã hết hạn (hết hạn cách đây 45 phút) để kiểm tra tính năng khóa nộp bài
    const due3 = new Date(now.getTime() - 45 * 60 * 1000);

    return [
        {
            id: 'hw-' + Date.now() + '-1',
            title: 'Bài tập Toán: Ôn tập Hình học không gian & Thể tích',
            subject: 'Toán học',
            className: '12A1',
            description: 'Các em tải file đề đính kèm bên dưới hoặc giải trực tiếp các câu hỏi. Có thể nộp bài bằng cách gõ trực tiếp hoặc chụp ảnh bài giải/xuất file PDF đính kèm lên hệ thống.',
            createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            dueDate: due1.toISOString(),
            allowLateSubmission: false,
            attachments: [
                {
                    name: 'De_on_tap_hinh_hoc_khong_gian_12.pdf',
                    type: 'application/pdf',
                    size: '1.4 MB',
                    dataUrl: ''
                }
            ],
            questions: [
                {
                    id: 'q1',
                    type: 'multiple_choice',
                    content: 'Trong không gian Oxyz, cho mặt cầu (S): x² + y² + z² - 2x + 4y - 6z + 5 = 0. Tọa độ tâm I và bán kính R là:',
                    options: [
                        'A. I(1, -2, 3), R = 3',
                        'B. I(-1, 2, -3), R = 9',
                        'C. I(1, -2, 3), R = 9',
                        'D. I(-1, 2, -3), R = 3'
                    ],
                    correctIndex: 0
                },
                {
                    id: 'q2',
                    type: 'multiple_choice',
                    content: 'Thể tích của khối chóp có diện tích đáy B = 18 cm² và chiều cao h = 7 cm là:',
                    options: [
                        'A. 126 cm³',
                        'B. 42 cm³',
                        'C. 63 cm³',
                        'D. 84 cm³'
                    ],
                    correctIndex: 1
                },
                {
                    id: 'q3',
                    type: 'essay',
                    content: 'Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, SA vuông góc với mặt phẳng đáy và SA = a√3. Hãy tính tang của góc tạo bởi đường thẳng SC và mặt phẳng đáy (ABCD).'
                }
            ],
            submissions: [
                {
                    id: 'sub-101',
                    studentUsername: 'hs_khang',
                    studentName: 'Nguyễn Minh Khang',
                    studentClass: '12A1',
                    startTime: new Date(now.getTime() - 95 * 60 * 1000).toISOString(),
                    submitTime: new Date(now.getTime() - 72 * 60 * 1000).toISOString(),
                    durationSeconds: 1380, // 23 phút
                    answers: {
                        'q1': 0,
                        'q2': 1,
                        'q3': 'Vì SA ⊥ (ABCD) nên hình chiếu vuông góc của SC lên đáy là AC. Do đó góc giữa SC và (ABCD) là góc ∠SCA.\nTa có đáy là hình vuông cạnh a => AC = a√2.\nXét tam giác vuông SAC tại A: tan(∠SCA) = SA / AC = (a√3) / (a√2) = √6 / 2.'
                    },
                    attachments: [
                        {
                            name: 'bai_giai_chi_tiet_hinh_hoc_khang.pdf',
                            type: 'application/pdf',
                            size: '820 KB',
                            dataUrl: ''
                        }
                    ],
                    status: 'on_time',
                    score: 9.5, // Điểm bảo mật cho hs_khang
                    feedback: 'Bài làm rất tốt, lập luận hình học rõ ràng và tính toán chính xác.'
                },
                {
                    id: 'sub-102',
                    studentUsername: 'hs_phuong',
                    studentName: 'Trần Thị Mai Phương',
                    studentClass: '12A1',
                    startTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
                    submitTime: new Date(now.getTime() - 41 * 60 * 1000).toISOString(),
                    durationSeconds: 1140, // 19 phút
                    answers: {
                        'q1': 0,
                        'q2': 1,
                        'q3': 'Góc giữa SC và mặt đáy là góc SCA. AC = a√2. tan(SCA) = SA/AC = a√3 / a√2 = √6/2 ≈ 1.2247.'
                    },
                    attachments: [
                        {
                            name: 'anh_chup_bai_lam_trang1.jpg',
                            type: 'image/jpeg',
                            size: '1.2 MB',
                            dataUrl: ''
                        }
                    ],
                    status: 'on_time',
                    score: 9.0, // Điểm bảo mật cho hs_phuong
                    feedback: 'Bài giải chính xác, vẽ hình sạch sẽ.'
                },
                {
                    id: 'sub-103',
                    studentUsername: 'hs_nam',
                    studentName: 'Lê Hoàng Nam',
                    studentClass: '12A1',
                    startTime: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
                    submitTime: new Date(now.getTime() - 14 * 60 * 1000).toISOString(),
                    durationSeconds: 1560, // 26 phút
                    answers: {
                        'q1': 0,
                        'q2': 0,
                        'q3': 'Góc giữa SC và (ABCD) là SCA. Ta tính AC = a*can(2). tan(SCA) = SA / AC = can(3) / can(2) = can(6)/2.'
                    },
                    attachments: [],
                    status: 'on_time',
                    score: 7.5, // Điểm bảo mật cho hs_nam
                    feedback: 'Chú ý câu 2: Công thức tính thể tích khối chóp là V = 1/3 * B * h, em quên nhân 1/3.'
                }
            ]
        },
        {
            id: 'hw-' + Date.now() + '-2',
            title: 'Ngữ Văn 11: Đọc hiểu và Nghị luận về Tinh thần Tự học',
            subject: 'Ngữ Văn',
            className: '11B2',
            description: 'Đọc kỹ văn bản đính kèm và làm bài. Các em có thể nộp bằng file Word/PDF hoặc viết trực tiếp.',
            createdAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
            dueDate: due2.toISOString(),
            allowLateSubmission: false,
            attachments: [
                {
                    name: 'Van_ban_doc_hieu_tu_hoc.pdf',
                    type: 'application/pdf',
                    size: '640 KB',
                    dataUrl: ''
                }
            ],
            questions: [
                {
                    id: 'q1',
                    type: 'essay',
                    content: 'Theo em, tại sao kỹ năng tự học lại được xem là chìa khóa quan trọng nhất trong kỷ nguyên số hiện nay? (Trả lời từ 3 - 5 câu)'
                },
                {
                    id: 'q2',
                    type: 'essay',
                    content: 'Hãy nêu một phương pháp tự học cụ thể mà em đang áp dụng hiệu quả cho bản thân.'
                }
            ],
            submissions: [
                {
                    id: 'sub-201',
                    studentUsername: 'hs_khoa',
                    studentName: 'Phạm Đăng Khoa',
                    studentClass: '11B2',
                    startTime: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
                    submitTime: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
                    durationSeconds: 1020, // 17 phút
                    answers: {
                        'q1': 'Tự học giúp chúng ta chủ động tiếp thu tri thức mới mà không bị giới hạn bởi thời gian hay không gian lớp học.',
                        'q2': 'Em áp dụng kỹ thuật Pomodoro kết hợp ghi chép sơ đồ tư duy (Mindmap).'
                    },
                    attachments: [],
                    status: 'on_time',
                    score: 8.5,
                    feedback: 'Ý tứ mạch lạc, nêu dẫn chứng thực tế rất tốt.'
                }
            ]
        },
        {
            id: 'hw-' + Date.now() + '-3',
            title: 'Tiếng Anh: 15-Minute Grammar & Vocabulary Quick Quiz',
            subject: 'Tiếng Anh',
            className: '10A3',
            description: 'Bài kiểm tra nhanh từ vựng Unit 4 và câu điều kiện. Bài tập này ĐÃ QUÁ HẠN NỘP để bạn kiểm tra tính năng khóa nộp bài.',
            createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            dueDate: due3.toISOString(),
            allowLateSubmission: false,
            attachments: [],
            questions: [
                {
                    id: 'q1',
                    type: 'multiple_choice',
                    content: 'If I _______ earlier this morning, I would not have missed the bus.',
                    options: [
                        'A. woke up',
                        'B. had woken up',
                        'C. would wake up',
                        'D. wake up'
                    ],
                    correctIndex: 1
                },
                {
                    id: 'q2',
                    type: 'multiple_choice',
                    content: 'She is fluent _______ both English and French.',
                    options: [
                        'A. in',
                        'B. on',
                        'C. with',
                        'D. at'
                    ],
                    correctIndex: 0
                }
            ],
            submissions: []
        }
    ];
}
